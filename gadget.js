/*
 *  ____        _ _ ____                        _                 
 * | __ )  __ _| | |  _ \ _ __ ___  _ __  _ __ (_)_ __   __ _ ___ 
 * |  _ \ / _` | | | | | | '__/ _ \| '_ \| '_ \| | '_ \ / _` / __|
 * | |_) | (_| | | | |_| | | | (_) | |_) | |_) | | | | | (_| \__ \
 * |____/ \__,_|_|_|____/|_|  \___/| .__/| .__/|_|_| |_|\__, |___/
 *                                 |_|   |_|            |___/     
 *  by Josh Nimoy, originally written in 2003,
 *     and ported to Processing.js in 2009
 *     more info and ports at http://balldroppings.com
 */
 
//global variables
 
var mouseIsDown = false;
var lines = [];
var balls = [];
var draggable = -1;
var dragside = 0;
var ballEmitterX=100;
var ballEmitterY=100;
var ticks = 0;
var ballDropRate = 100;
var gravity = 0.3;
 
//-------------------------------------------------------------
 
//class
function V3(newx,newy,newz){
    
    this.x=newx;
    this.y=newy;
    this.z=newz;
    
    this.dot = function(vec){
	return ((this.x*vec.x)+(this.y*vec.y)+(this.z*vec.z));
    }
    
    this.copyFrom = function(that){
	this.x=that.x;
	this.y=that.y;
	this.z=that.z;
    }
    
    this.copyFrom = function(xx,yy,zz){
	this.x=xx;
	this.y=yy;
	this.z=zz;
    }
    
    this.getRightNormal = function(){
	return new V3(this.y , -this.x , 0);
    }
    
    this.getLeftNormal = function(){
	return new V3(-this.y , this.x , 0);
    }
    
    this.normalize = function(){
	var norm = this.getLength(); 
	this.x /= norm;
	this.y /= norm;
	this.z /= norm;
    }
    
    this.getLength = function(){
	return Math.sqrt( this.x*this.x + this.y*this.y + this.z*this.z );
    }
    
    this.scaleVec = function(scalar){
	this.x*=scalar;
	this.y*=scalar;
	this.z*=scalar; 
    }
    
    this.minVecNew = function(vec){
	return new V3(this.x - vec.x, this.y - vec.y , this.z - vec.z);
    }
    
    
    this.selfMul = function(a){
	this.x*=a;
	this.y*=a;
	this.z*=a;
    }
    
    this.selfPlus = function(v){
	this.x+=v.x;
	this.y+=v.y;
	this.z+=v.z;
    }
    
    this.lerpSelfTo = function(that,scale){
	this.x+=(that.x-this.x) * scale;
	this.y+=(that.y-this.y) * scale;
	this.z+=(that.z-this.z) * scale;
    }
    
}//end class
 
//-------------------------------------------------------------
 
//class
function EditLine(){
    this.x1 = 0;
    this.y1 = 0;
    this.x2 = 0;
    this.y2 = 0;
    
    this.diffSign = function(v1,v2){
	if( (v1 >= 0 && v2 < 0 ) || (v2 >= 0 && v1 < 0 ) )return true;
	else return false;
    }
 
    
    this.checkAngle = function(  point_x,  point_y, line_x,  line_y,  lineVec){
	var vec = new V3(line_x - point_x, line_y - point_y, 0);
	var vecline = new V3(0,0,0);
	vecline.copyFrom(lineVec.x,lineVec.y,lineVec.z);
	
	vecline = vecline.getRightNormal();
	
	vec.normalize();
	vecline.normalize();
	return vec.dot(vecline);
	
    }
    
    this.checkBallCollide = function(ball){
	
	var lineLocalVec = new V3(this.x2-this.x1, this.y2-this.y1, 0);
	
	//get the angle between the ball and one end of the wall
	var angleCurrent1 = this.checkAngle(ball.x , ball.y , this.x1,this.y1, lineLocalVec);  
	var angleCurrent2 = this.checkAngle(ball.x , ball.y , this.x2,this.y2, lineLocalVec);  
	
	//lets get the angle between the ball and one end of the wall
	var angleFuture1 = this.checkAngle(ball.x+ball.forceX, ball.y+ball.forceY
					   ,this.x1,this.y1, lineLocalVec);
	var angleFuture2 = this.checkAngle(ball.x+ball.forceX, ball.y+ball.forceY
					   ,this.x2,this.y2, lineLocalVec);
	
	if(this.diffSign(angleCurrent1,angleFuture1) && this.diffSign(angleCurrent2,angleFuture2)){
	    var d1x = ball.x - this.x1;
	    var d1y = ball.y - this.y1;
	    var d2x = ball.x - this.x2;
	    var d2y = ball.y - this.y2;
	    var wallLength = lineLocalVec.getLength();
	    if( (Math.sqrt(d1x*d1x + d1y*d1y) < wallLength) && (Math.sqrt(d2x*d2x + d2y*d2y) < wallLength)){
		return true;
	    }
	    else return false;
	}
	else return false;
    }
    
    
}//end class
 
 
//-------------------------------------------------------------
 
 
//class
function Ball(){
    
    this.x = 0;
    this.y = 0;
    this.forceX = 0;
    this.forceY = 0;
    this.rad = 3;
    this.destRad = 3;
    
    this.step = function(){
	this.x += this.forceX;
	this.y += this.forceY;
	this.forceY+=gravity;
	this.rad += (this.destRad - this.rad) * 0.1;
    }
    
    this.bounce = function( x1, y1, x2, y2){
	
	//Thank you to Theo Watson for helping me out here.
	//V
	var v = new V3(this.forceX,this.forceY,0);
	
	//N
	var n = new V3(x2-x1,y2-y1,0);
	n = n.getLeftNormal();
	n.normalize();
 
	//2 * V [dot] N
	var dotVec = v.dot(n) * 2;
 
	// ( 2 * V [dot] N ) N
	n.scaleVec(dotVec);
 
	//V - ( 2 * V [dot] N ) N
	//change direction
	var mvn = v.minVecNew(n);
	this.forceX = mvn.x;
	this.forceY = mvn.y;
	
	//enlarge the ball
	
	this.rad = Math.sqrt(this.forceX*this.forceX + 
			     this.forceY*this.forceY);
	
	//play a sound
	/*var fm = getFlashMovie("sound");
	var vel = this.rad;
	
	if(vel>39)vel=39;//don't blow the array
	if(vel<0)vel=0;
	
	fm.playSound(Math.round(vel));//call flash function*/
    }
}//end class
 
 
//-------------------------------------------------------------
 
 
window.onload = function (){

    //gadgets.window.adjustHeight();
    
    //make a Processing.js instance
    var p = Processing("canvasElement");
    
    
    p.setup = function(){
	this.size(window.innerWidth,window.innerHeight-100);
    };
    
    
    p.mousePressed = function (){
	mouseIsDown = true;
	
	//checking for dragging old line
	var foundOne = false;
	for(var i=0;i<lines.length;i++){
	    if(this.dist(lines[i].x1,lines[i].y1,p.mouseX,p.mouseY)<6){
		foundOne = true;
		draggable = i;
		dragside = 0;
		break;
	    }
	    
	    if(this.dist(lines[i].x2,lines[i].y2,p.mouseX,p.mouseY)<6){
		foundOne = true;
		draggable = i;
		dragside = 1;
		break;
	    }
	}
	
	
	if(!foundOne){
	    var newLine = new EditLine();
	    newLine.x1 = p.mouseX;
	    newLine.y1 = p.mouseY;
	    newLine.x2 = p.mouseX;
	    newLine.y2 = p.mouseY;
	    lines.push(newLine);
	}
	
    };
    
    p.mouseReleased = function (){
	mouseIsDown = false;
	draggable = -1;
	
    };
    
    
    
    p.draw = function () {
	
	//STEP
	
	//drawing a line
	if(mouseIsDown){
	    if(draggable==-1){
		lines[lines.length-1].x2 = p.mouseX;
		lines[lines.length-1].y2 = p.mouseY;
	    }else{
		if(dragside){
		    lines[draggable].x2 = p.mouseX;
		    lines[draggable].y2 = p.mouseY;
		}else{
		    lines[draggable].x1 = p.mouseX;
		    lines[draggable].y1 = p.mouseY;
		}
	    }
	}
	
	//step balls
	for(var i=0;i<balls.length;i++){
	    balls[i].step();
	}
	
	//step lines
	for(var i=0;i<lines.length;i++){
	    for(var j=0;j<balls.length;j++){
		if(lines[i].checkBallCollide(balls[j])){
		    balls[j].bounce(lines[i].x1,lines[i].y1,
				    lines[i].x2,lines[i].y2);
		}
	    }
	}
	
	//new balls
	if(ticks%ballDropRate==0){
	    var newball = new Ball();
	    newball.x = ballEmitterX;
	    newball.y = ballEmitterY;
	    balls.push(newball);
	}
	
	//old balls
	if(balls.length>0){
	    if(balls[0].y > window.innerHeight){
		balls.shift();
	    }
	}
	
	
	//DRAW
	this.background(0);
	
	//draw lines
	this.stroke(255);
	for(var i=0;i<lines.length;i++){
	    this.line(lines[i].x1, lines[i].y1,
		      lines[i].x2, lines[i].y2);
	}
	
	//draw ends?
	this.fill(255);
	this.noStroke();
	for(var i=0;i<lines.length;i++){
	    
	    if(this.dist(lines[i].x1,lines[i].y1,p.mouseX,p.mouseY)<6){
		this.rect(lines[i].x1-3,lines[i].y1-3,6,6);
	    }
	    
	    if(this.dist(lines[i].x2,lines[i].y2,p.mouseX,p.mouseY)<6){
		this.rect(lines[i].x2-3,lines[i].y2-3,6,6);
	    }
	    
	}
	
	//draw emmiter
	this.stroke(100);
	this.noFill();
	this.ellipse(ballEmitterX,ballEmitterY, 12, 12);
	
	//draw balls
	this.fill(255);
	this.noStroke();
	for(var i=0;i<balls.length;i++){
	    this.ellipse(balls[i].x,balls[i].y,
			 balls[i].rad*2, balls[i].rad*2);
	}
	
	
	ticks++;
    };
 
    //keep the canvas element the same size as the window
    this.resize = function(){
	p.size(window.innerWidth,window.innerHeight-100);
    }
    
    //start processing.js
    p.init();
    
};
 
window.onresize = function(){
    this.resize();
}
 
 
//-------------------------------------------------------------
 
//reset button
function reset(){
    lines = [];
    balls = [];
    ballDropRate = 100;
    gravity = 0.3;
}
 
 
//browser independent way to get the flash element
function getFlashMovie(movieName) {
    var isIE = navigator.appName.indexOf("Microsoft") != -1;
    return (isIE) ? window[movieName] : document[movieName];
}
 
 
//-------------------------------------------------------------
