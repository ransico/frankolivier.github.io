'use strict';

window.onload = main;	// Startup

// Point object (-1 to 1 range)
function Point(x, y) {			//bugbug move to util class file?
    if (x<-1) x = -1;
    if (y<-1) y = -1;
    if (x>1) x = 1;
    if (y>1) y = 1;
    
    this.x = x;
	this.y = y;
}



var renderer = new function() {

	var gl;                 // Handle to the context
	var pictureprogram;     // Handle to GLSL program that draws a picture

	this.texCoordLocation;	// BUGBUG?

	this.drawCoordLocation;	// BUGBUG?

	this.texCoordBuffer;
    

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


		// Set the viewport size
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
	    
	    try {
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

/*
            var ptlx = 0.055;
			var ptly = 0.86;

			var ptrx = 0.79;
			var ptry = 0.92;

			var pbrx = 0.85;
			var pbry = 0.26;

            var pblx = 0.15;
			var pbly = 0.1;
*/

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

/*
			
			

			
*/
/*
			//var topLeft = new Point(0,1);
			var topLeft = new Point(0.06, 0.85);

			//var topRight = new Point(1,1);
			var topRight = new Point(0.79, 0.92);

			//var bottomRight = new Point(1,0);
			var bottomRight = new Point(0.84,0.26);

			//var bottomLeft = new Point(0,0);
			var bottomLeft = new Point(0.15,0.1);
*/
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

	    }

	    catch (e) {
	        log('shader fail');
	        return;
	    }
        
        
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
		var canvas = document.getElementById("inputcanvas");
		var ctx = canvas.getContext("2d");
		
		var ll = document.getElementById("inputcanvas").height;

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

		//bugbug split this into seperate files / interfaces
		this.render();

	}

	this.updateCorners = function(corners) {
		//console.log("! " + corners.topLeft.x + " " + corners.topLeft.y + " " + corners.topRight.x + " " + corners.topRight.y);

		this.gl.uniform2f(this.pictureprogram.topLeft, corners.topLeft.x, corners.topLeft.y);
		this.gl.uniform2f(this.pictureprogram.topRight, corners.topRight.x, corners.topRight.y);
		this.gl.uniform2f(this.pictureprogram.bottomRight, corners.bottomRight.x, corners.bottomRight.y);
		this.gl.uniform2f(this.pictureprogram.bottomLeft, corners.bottomLeft.x, corners.bottomLeft.y);
		this.render();

	}.bind(this)

	this.render = function () {
   
		var gl = this.gl;
		
		gl.clearColor(1.0, 0.0, 1.0, 0.5);
		gl.clear(this.gl.COLOR_BUFFER_BIT);

		var program;
        
        // TODO drawElements would be more efficient here


		program = this.pictureprogram;

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		
		gl.useProgram(this.pictureprogram);

		gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0);

		gl.enableVertexAttribArray(this.texCoordLocation);


		gl.drawArrays(gl.TRIANGLES, 0, 2 * 3); // Draw 2 triangles




	}
	






}





// Program starts here
function main() {
	renderer.init();
	cornerUI.init(document.getElementById('inputcanvas'), renderer.updateCorners);


    //init2();

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





