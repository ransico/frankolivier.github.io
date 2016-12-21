'use strict';


var cornerUI = new function() {

	var picturecanvas;
	var updateFunction; 

    var self = this;


	// getMousePoint
	// in - mouse event e
	this.getMousePoint = function(e) {
		var x;
		var y;

		if (e.offsetX) {
			x = e.offsetX;
			y = e.offsetY;
		}
		else if (e.layerX) {
			x = e.layerX;
			y = e.layerY;
		}
		else {
			return undefined; //Work around Chrome bugbug
		}

		return self.normalizedPoint(x, y);
	}

	this.normalizedPoint = function(x, y) 
	{
		x = (x / self.picturecanvas.width);
		y = (1 - (y / self.picturecanvas.height));
		
		return new Point(x, y);
	}

/*
	this.topLeft = new this.Point(0.095, 1);
	this.topRight = new this.Point(0.645, 1);
	this.bottomRight = new this.Point(0.631,0);
	this.bottomLeft = new this.Point(0.046,0);
*/
	this.topLeft = new Point(0, 1);
	this.topRight = new Point(1, 1);
	this.bottomRight = new Point(1,0);
	this.bottomLeft = new Point(0,0);
    this.activePoint = undefined;

	this.updateX = function(downpoint)
	{
		if (typeof self.activePoint != 'undefined')
		{
			self.activePoint.x = downpoint.x;
			self.activePoint.y = downpoint.y;  //bugbug make this better; direct assignment?
			self.updateFunction(this);
		}
	}

	this.downhandler = function (e) {
			var downpoint = self.getMousePoint(e);
			//console.log(downpoint.x + " DOWN " + downpoint.y);

			// find the closest corner, and the closest point

			var topLeftCorner = new Point(0, 1);
			var topRightCorner = new Point(1, 1);
			var bottomRightCorner = new Point(1,0);
			var bottomLeftCorner = new Point(0,0);

			var corners = [topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner];			
			var activePoints = [self.topLeft, self.topRight, self.bottomRight, self.bottomLeft];
			
			var smallestDistance = 9999999999;	// More than the max possible distance in a 2 * 2 square

			for (var i = 0; i < 4; i++)
			{
				var corner = corners[i];
				var distance = downpoint.distanceFrom(corner);

				//console.log(distance + " DISTANCE " + smallestDistance);

				if (distance < smallestDistance)
				{
					self.activePoint = activePoints[i];
					smallestDistance = distance;
				}

			}

			/*
			corners.forEach(
				function(corner)
				{




				}
			);
			*/

			if (self.activePoint == self.topLeft) console.log("TOPLEFT");
			if (self.activePoint == self.topRight) console.log("TOPRIGHT");
			if (self.activePoint == self.bottomLeft) console.log("BOTTOMLEFT");
			if (self.activePoint == self.bottomRight) console.log("BOTTOMRIGHT");
			

			self.updateX(downpoint);


			


		}

	this.movehandler = function (e) {
			var point = self.getMousePoint(e);
			self.updateX(point);
		}

	this.uphandler = function (e) {
			var point = self.getMousePoint(e);
			//console.log(point.x + " UP " + point.y);
			self.updateX(point);
			self.activePoint = undefined;	//bugbug write this better
		}



	this.outhandler = function (e) {
			var point = self.getMousePoint(e);
			//console.log(point.x + " OUT " + point.y);
			self.updateX(point);
			self.activePoint = undefined;
		}


	this.init = function(thecanvas, updateFunction)
	{


		//check for canvas type bugbug


		//bugbug add a second canvas over the picture canvas, for the touch grippers?

		this.picturecanvas = thecanvas;
		this.updateFunction = updateFunction;
		
  		this.picturecanvas.addEventListener("mousedown", this.downhandler);   
  		this.picturecanvas.addEventListener("mousemove", this.movehandler);   
  		this.picturecanvas.addEventListener("mouseup", this.uphandler);   
		this.picturecanvas.addEventListener("mouseout", this.outhandler);


		/*
		this.picturecanvas.onmousedown = function (e) {
		    
		}

		this.picturecanvas.onmouseup = function (e) {


		}

		this.picturecanvas.onmouseout = function (e) {

		};

		this.picturecanvas.onmousemove = this.movehandler;
		*/

	}

}




/*


function Move(point) { // a new manipulation
	this.point1 = new Point(point.x, point.y);
	this.point2 = new Point(point.x, point.y);
	
	this.move = function (point) {
		this.point2.x = point.x;
		this.point2.y = point.y;
	}
	
}

var renderer = new function() {

	var gl;                 // Handle to the context
	var lineprogram;        // Handle to GLSL program that draws lines
	var pictureprogram;     // Handle to GLSL program that draws a picture

	this.texCoordLocation;	// BUGBUG?

	this.drawCoordLocation;	// BUGBUG?

	this.texCoordBuffer;
    
	var moves = new Array;
	var MAXMOVES = 8;
	var currentMove = 0;

	this.init = function () {
		// Get a context
	    var canvas = document.getElementById("webglcanvas");

	    try
	    {
            // use antialias:false to make lines more visible
            var gl = this.gl = canvas.getContext("experimental-webgl", { antialias:false, preserveDrawingBuffer: true });
	    }
	    catch (e)
	    {
	        // Workaround for Firefox issue
	    }

        if (!this.gl) { document.getElementById("DemoIntroduction").style.display = "block"; return; }

		// Set the viewport size
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
	    


        
                

	    //try {
	        var vertexshader = getShader(gl, "2d-vertex-shader");
	        var fragmentshader = getShader(gl, "2d-fragment-shader");

	        this.pictureprogram = loadProgram(gl, vertexshader, fragmentshader);
	        gl.useProgram(this.pictureprogram);


			


	        // look up where the vertex data needs to go.
	        this.texCoordLocation = gl.getAttribLocation(this.pictureprogram, "a_texCoord");


	        // provide texture coordinates for the rectangle.
	        this.texCoordBuffer = gl.createBuffer();
	        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);

	        var c = new Float32Array(12); //2 numbers per coord; three coords per triangle; 2 triagles per square; resolution * resolution squares

	        var i = 0;


            var ptlx = 0;
			var ptly = 1;

			var ptrx = 1;
			var ptry = 1;

			var pbrx = 1;
			var pbry = 0;

            var pblx = 0;
			var pbly = 0;

			c[i++] = pblx; //
			c[i++] = pbly;

			c[i++] = pbrx; //
			c[i++] = pbry;

			c[i++] = ptlx; //
			c[i++] = ptly;

			c[i++] = pbrx;
			c[i++] = pbry;

			c[i++] = ptlx;
			c[i++] = ptly;

			c[i++] = ptrx; //
			c[i++] = ptry;

	        gl.bufferData(gl.ARRAY_BUFFER, c, gl.STATIC_DRAW);
	        
	        gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0);

	        gl.enableVertexAttribArray(this.texCoordLocation);

	        // Set up uniforms

	        // Set the texture to use
	        this.pictureprogram.u_image = gl.getUniformLocation(this.pictureprogram, "u_image");
	        gl.uniform1i(this.pictureprogram.u_image, 0);

			this.pictureprogram.topLeft = gl.getUniformLocation(this.pictureprogram, "topLeft");
			this.pictureprogram.topRight = gl.getUniformLocation(this.pictureprogram, "topRight");
			this.pictureprogram.bottomRight = gl.getUniformLocation(this.pictureprogram, "bottomRight");
			this.pictureprogram.bottomLeft = gl.getUniformLocation(this.pictureprogram, "bottomLeft");


			//var topLeft = new Point(0,1);
			var topLeft = new Point(0.095, 1);

			//var topRight = new Point(1,1);
			var topRight = new Point(0.645, 1);

			//var bottomRight = new Point(1,0);
			var bottomRight = new Point(0.631,0);

			//var bottomLeft = new Point(0,0);
			var bottomLeft = new Point(0.046,0);

		    gl.uniform2f(this.pictureprogram.topLeft, topLeft.x, topLeft.y);
			gl.uniform2f(this.pictureprogram.topRight, topRight.x, topRight.y);
			gl.uniform2f(this.pictureprogram.bottomRight, bottomRight.x, bottomRight.y);
			gl.uniform2f(this.pictureprogram.bottomLeft, bottomLeft.x, bottomLeft.y);
    
        
	    this.loadImage();
	}

	this.loadImage = function () {

		var image = new Image();
		
		image.onload = function () {
			renderer.loadImage2(image);
		}

		image.src = "photos/fo.jpg";

	}

	this.loadImageX = function (dataURL) {
		var image = new Image();
		
		image.onload = function () {
			renderer.loadImage2(image);
		}

		image.src = dataURL;
	}

	this.loadImage2 = function (image) {

		//convert the image to a square image via the temporary 2d canvas 
		var canvas = document.getElementById("2dcanvas");
		var ctx = canvas.getContext("2d");
		
		var ll = document.getElementById("2dcanvas").height;

		var x = 0;
		var y = 0;
		var xx = ll;
		var yy = ll;

		ctx.clearRect(0, 0, ll, ll);

		if (image.width < image.height) {
			// change x, xx
			xx = image.width / image.height * ll;
			x = (ll - xx) / 2;
		}
		if (image.width > image.height) {
			// change y, yy
			yy = image.height / image.width * ll;
			y = (ll - yy) / 2;
		}

		ctx.drawImage(image, 0, 0, image.width, image.height, x, y, xx, yy);

		var gl = this.gl;
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

		// Set the parameters so we can render any size image.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

		// Upload the image into the texture.
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

		ctx.clearRect(0, 0, ll, ll);

		this.reset();
		//this.render();

	}

	this.modeOff = 0;
	this.modeHint = 1;
	this.modeHint2 = 2;
	this.modeUniform = 3;

	this.canvasMode = this.modeHint;

    this.canvasMode = this.modeUniform;

	this.render = function () {
   
		var gl = this.gl;
		
		var p1 = new Float32Array(MAXMOVES * 2); //x and y
		var p2 = new Float32Array(MAXMOVES * 2); //x and y

	    // set up the arrays of uniforms; log
		{
		    var index = 0;
		    for (var i = 0; i < MAXMOVES; i++) {

		        var x1, y1, x2, y2;

		        if (moves[i]) {
		            x1 = moves[i].point1.x;
		            y1 = moves[i].point1.y;
		            x2 = moves[i].point2.x;
		            y2 = moves[i].point2.y;
		        }
		        else {
		            x1 = 1;
		            y1 = 1;
		            x2 = 0.9999999;
		            y2 = 0.9999999;
		        }

		        p1[index] = x1;
		        p1[index + 1] = y1;
		        p2[index] = x2;
		        p2[index + 1] = y2;
		        index += 2;

		    }
		}
        
		gl.clearColor(1.0, 1.0, 1.0, 0.5);
		gl.clear(this.gl.COLOR_BUFFER_BIT);

		var program;
        
        // TODO drawElements would be more efficient here


		program = this.pictureprogram;

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		
		gl.useProgram(this.pictureprogram);

		gl.uniform2fv(gl.getUniformLocation(this.pictureprogram, "p1"), p1);
		gl.uniform2fv(gl.getUniformLocation(this.pictureprogram, "p2"), p2);

		gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0);

		gl.enableVertexAttribArray(this.texCoordLocation);


		gl.drawArrays(gl.TRIANGLES, 0, 2 * 3); // Draw 2 triangles









		if (this.canvasMode == this.modeUniform) {
            var canvas = document.getElementById("2dcanvas");
	        var ctx = canvas.getContext("2d");
	        //bugbug - make this faster by caching the previous value and only clearing if needed
	        ctx.clearRect(0, 0, canvas.width, canvas.height);

		    for (var i = 0; i < MAXMOVES; i++) {
		        if (moves[i]) {
		            var x1 = (moves[i].point1.x + 1) * canvas.width / 2;
		            var y1 = (-moves[i].point1.y + 1) * canvas.height / 2;
		            var x2 = (moves[i].point2.x + 1) * canvas.width / 2;
		            var y2 = (-moves[i].point2.y + 1) * canvas.height / 2;

                    // the raio is used here to show where the pixel started and ended bugbug
		            var ratio = 0.3;
		            x2 = x1 + (x2 - x1) * ratio;
		            y2 = y1 + (y2 - y1) * ratio;

		            var radius = 6;

		            //ctx.globalAlpha = 0.5;

		            ctx.beginPath();

		            var grd = ctx.createLinearGradient(x1, y1, x2, y2);
		            grd.addColorStop(0, 'pink');
		            grd.addColorStop(1, 'red');

		            ctx.setLineDash([5, 5]);
		            ctx.lineWidth = radius / 2;
		            ctx.moveTo(x1, y1);
		            ctx.lineTo(x2, y2);
		            ctx.strokeStyle = grd;
		            ctx.stroke();

		            ctx.beginPath();
		            ctx.arc(x1, y1, radius, 0, 2 * Math.PI, false);
		            ctx.fillStyle = 'pink';
		            ctx.fill();

		            ctx.beginPath();
		            ctx.arc(x2, y2, radius, 0, 2 * Math.PI, false);
		            ctx.fillStyle = 'red';
		            ctx.fill();




		        }
		    }
		}

	}
	
    // (point) is where the 
	this.newMove = function(point) //where the warp starts (-1 to 1 range)
	{
		//currentMove++;
		//currentMove %= MAXMOVES; //Loop back to 0;

		var move = new Move(point);
		
		moves.unshift(move);

		return move;
	}

	this.reset = function () {
		moves = [];
		this.render();
	}

	this.undo = function () {
		moves.shift();
		this.render();
	}

	this.save = function () {
		var dataURL = document.getElementById("webglcanvas").toDataURL("image/jpg");
		var blobObject = dataURLtoBlob(dataURL);

		if (window.navigator.msSaveBlob) window.navigator.msSaveBlob(blobObject, 'warpedphoto.jpg');

		if (window.navigator.saveBlob) {
		    window.navigator.saveBlob(blobObject, 'warpedphoto.jpg');
		}
		else {
                    dataURL = dataURL.replace("image/png", "image/octet-stream");
	            window.location.href = dataURL;
		}


	}


}

// getMousePoint
// in - mouse event e
function getMousePoint(e) {
	var x;
	var y;

	if (e.offsetX) {
		x = e.offsetX;
		y = e.offsetY;
	}
	else if (e.layerX) {
		x = e.layerX;
		y = e.layerY;
	}
	else {
		return undefined; //Work around Chrome bugbug
	}

	return normalizedPoint(x, y);
}


var inputHandler = new function() {
	var move; // Pointer to a uniform variable in the renderer object

	this.init = function () {
		var canvas = document.getElementById("2dcanvas");

		canvas.onmousedown = function (e) {
		    this.move = renderer.newMove(getMousePoint(e));		    
		}

		canvas.onmouseup = function (e) {
			this.move = undefined;
			renderer.render();
		}

		canvas.onmouseout = function (e) {
		    this.move = undefined;
			renderer.render();


		};

		canvas.onmousemove = function (e) {

		    var point = getMousePoint(e);

			if (typeof this.move != 'undefined')
			{
				if (typeof point != 'undefined')
				{
					this.move.move(point);
				}
				renderer.render();
			}

		};

		canvas.ondragstart = function (e) { //Workaround for Chrome
		    //console.log("ondragstart");
		    e.preventDefault();
		};


	}

}

function temptemp(moves, renderer) {


      
    for (var i = 0; i < moves.length; i++) {
        moves[i].point2.x += moves[i].stepx;
        moves[i].point2.y += moves[i].stepy;
        moves[i].step++;
        
        if (moves[i].step > 600) {

            moves[i].point1.x = Math.random() * 2 - 1;
            moves[i].point1.y = Math.random() * 2 - 1;
            moves[i].point2.x = moves[i].point1.x + 0.001;
            moves[i].point2.y = moves[i].point1.y + 0.001;

            moves[i].step = Math.random() * 20;
            moves[i].stepx = (Math.random() * 0.02 - 0.01) / 4;
            moves[i].stepy = (Math.random() * 0.02 - 0.01) / 4;
        }

    }

    renderer.render();

    //console.log(Math.random());

    setTimeout(function () { temptemp(moves, renderer) }, 1000/60);
}


var demoHandler = new function () {
    
    var moves = new Array;

    function randomX() {
        return Math.random() * 2 - 1;
    }


    this.start = function () {
        this.demoMode = true;

        
        for (var i = 0; i < 4; i++) {
            var temp = new Point(randomX(), randomX());

            var newmove = renderer.newMove(temp);
            newmove.point2.x = temp.x + 0.001;
            newmove.point2.y = temp.y + 0.001;

            newmove.step = 0; //Math.random() * 100;
            newmove.stepx = Math.random() * 0.002 - 0.001;
            newmove.stepy = Math.random() * 0.002 - 0.001;

            moves.unshift(newmove);
                        
            setTimeout(function () { temptemp(moves, renderer) }, 100);

        }

        

    }


	this.init = function () {

	}
}


// Program starts here
function main() {
	renderer.init();

	//demoHandler.init();
	inputHandler.init();
	
	demoHandler.init();

    //init2();
}

// Resets the current distortion to 0
function reset(point) {
	point1[currentPoint].x = 1;
	point1[currentPoint].y = 1;
	point2[currentPoint].x = 1.00001;
	point2[currentPoint].y = 1.00001;
	
	setVec2PointArray("p1", point1);
	setVec2PointArray("p2", point2);
}

function undo() {
	renderer.undo();
}

function reset() {
	renderer.reset();
}



function save() {
	renderer.save();
}

function demo() {
    demoHandler.start();
}


function normalizedPoint(x, y) 
{
	var canvas = document.getElementById("2dcanvas");
	x = (x / canvas.width) * 2 - 1;
	y = (1 - (y / canvas.height)) * 2 - 1;
	
	return new Point(x, y);
}



function setVec2(id, a, b) {
	gl.uniform2f(gl.getUniformLocation(program, id), a, b);
}




// Adds a string to the log in the web page
function log(result) {
    var resultDiv = document.getElementById("log");
    resultDiv.innerHTML += result + "<br />";
}

// Adds a string to the log in the web page; overwrites everything in the log with the new string
function logi(result) {
    var resultDiv = document.getElementById('log');
    resultDiv.innerHTML = result;
}


// Loads a shader from a script tag
// [in] WebGL context
// [in] id of script element with the shader to load
function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3)
            str += k.textContent;
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}


function loadProgram(gl, vertexshader, fragmentshader)
{
    var program = gl.createProgram();
    gl.attachShader(program, vertexshader);
    gl.attachShader(program, fragmentshader);

    gl.linkProgram(program);

    // Check the link status
    var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
        // something went wrong with the link
        lastError = gl.getProgramInfoLog(program);
        alert("Error in program linking:" + lastError);

        gl.deleteProgram(program);
        return;
    }
    return program;
};



*/

