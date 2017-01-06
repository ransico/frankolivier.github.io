'use strict';

window.onload = main;	// Startup


var renderer = new function () {

	var gl;                 // Handle to the context
	var pictureprogram;     // Handle to GLSL program that draws a picture

	this.texCoordLocation;	// BUGBUG?
	this.texCoordBuffer;	// BUGBUG?


	this.init = function () {
		var canvas = document.getElementById("outputcanvas");

		try {
			// use antialias:false to make lines more visible
			var gl = this.gl = canvas.getContext("experimental-webgl", { antialias: false, preserveDrawingBuffer: true });
		}
		catch (e) {
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

			var ptlx = 0;
			var ptly = 1;

			var ptrx = 1;
			var ptry = 1;

			var pbrx = 1;
			var pbry = 0;

			var pblx = 0;
			var pbly = 0;

			c[i++] = pblx;
			c[i++] = pbly;

			c[i++] = pbrx;
			c[i++] = pbry;

			c[i++] = ptlx;
			c[i++] = ptly;

			c[i++] = pbrx;
			c[i++] = pbry;

			c[i++] = ptlx;
			c[i++] = ptly;

			c[i++] = ptrx;
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
			var bottomRight = new Point(0.631, 0);

			//var bottomLeft = new Point(0,0);
			var bottomLeft = new Point(0.046, 0);

			gl.uniform2f(this.pictureprogram.topLeft, topLeft.x, topLeft.y);
			gl.uniform2f(this.pictureprogram.topRight, topRight.x, topRight.y);
			gl.uniform2f(this.pictureprogram.bottomRight, bottomRight.x, bottomRight.y);
			gl.uniform2f(this.pictureprogram.bottomLeft, bottomLeft.x, bottomLeft.y);

		}

		catch (e) {
			console.log('Shader failure');
			return;
		}


		this.loadImage('photos/fo.jpg');

	}

	this.inputImage = "";
	this.canvas = document.getElementById("inputcanvas");
	this.ctx = this.canvas.getContext("2d");

	this.loadImage = function (dataURL) {

		this.inputImage = new Image();

		this.inputImage.onload = function () {
			renderer.loadImage2(this.inputImage);
		}

		this.inputImage.src = dataURL;

		// reset grippers to default? TODO
		////TODO this.drawInputImage();
	}

	// bugbug todo break this up into setupinputimage and drawinputimage
	this.drawInputImage = function () {

		var ll = this.canvas.height;	// Canvas is square, so only need to get one side

		var x = 0;
		var y = 0;
		var xx = ll;
		var yy = ll;

		this.ctx.clearRect(0, 0, ll, ll);

		if (this.inputImage.width < this.inputImage.height) {
			// change x, xx
			xx = this.inputImage.width / this.inputImage.height * ll;
			x = (ll - xx) / 2;
		}
		if (this.inputImage.width > this.inputImage.height) {
			// change y, yy
			yy = this.inputImage.height / this.inputImage.width * ll;
			y = (ll - yy) / 2;
		}

		this.ctx.drawImage(this.inputImage, 0, 0, this.inputImage.width, this.inputImage.height, x, y, xx, yy);

		/*
				this.ctx.beginPath();
				this.ctx.strokeStyle = "rgb(100, 0, 0)";
				this.ctx.setLineDash([5, 5]);
				this.ctx.moveTo(corners.topLeft.x * this.canvas.width, (1 - corners.topLeft.y) * this.canvas.height);
				this.ctx.lineTo(corners.topRight.x * this.canvas.width, (1 - corners.topRight.y) * this.canvas.height);
				this.ctx.lineTo(corners.bottomRight.x * this.canvas.width, (1 - corners.bottomRight.y) * this.canvas.height);
				this.ctx.lineTo(corners.bottomLeft.x * this.canvas.width, (1 - corners.bottomLeft.y) * this.canvas.height);
				this.ctx.lineTo(corners.topLeft.x * this.canvas.width, (1 - corners.topLeft.y) * this.canvas.height);
				this.ctx.stroke();
		*/

	}

	this.loadImage2 = function (image) {

		//convert the image to a square image via the temporary 2d canvas 

		this.drawInputImage();

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
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas);

		//bugbug split this into seperate files / interfaces
		this.render();

	}

	// The aspect ratio of the rendered bitmap
	this.renderWidth = 1;
	this.renderHeight = 1;

	function ratio(input, rr)
	{
		return 1 - Math.pow(input, rr);
	}

	this.updateCorners = function (corners) {
		this.gl.uniform2f(this.pictureprogram.topLeft, corners.topLeft.x, corners.topLeft.y);
		this.gl.uniform2f(this.pictureprogram.topRight, corners.topRight.x, corners.topRight.y);
		this.gl.uniform2f(this.pictureprogram.bottomRight, corners.bottomRight.x, corners.bottomRight.y);
		this.gl.uniform2f(this.pictureprogram.bottomLeft, corners.bottomLeft.x, corners.bottomLeft.y);
		this.render();

		// take the average of the two sides - this helps set the right aspect ratio for the output image
		// BUBGUG improve this aspect ratio algorithm
		this.renderWidth = (corners.topLeft.distanceFrom(corners.topRight) + corners.bottomLeft.distanceFrom(corners.bottomRight)) / 2;
		this.renderHeight = (corners.topLeft.distanceFrom(corners.bottomLeft) + corners.topRight.distanceFrom(corners.bottomRight)) / 2;

		var rr = corners.bottomLeft.distanceFrom(corners.bottomRight) / corners.topLeft.distanceFrom(corners.topRight);

		console.log("Ratio = " + rr);

		this.drawInputImage();

		//console.log(corners.topLeft.x, corners.topLeft.y, corners.topRight.x, corners.topRight.y, corners.bottomRight.x, corners.bottomRight.y, corners.bottomLeft.x, corners.bottomLeft.y);


		this.ctx.strokeStyle = "rgb(255, 0, 0)";

		this.ctx.beginPath();
//		this.ctx.setLineDash([5, 5]);
		this.ctx.moveTo(corners.topLeft.x * this.canvas.width, (1 - corners.topLeft.y) * this.canvas.height);
		this.ctx.lineTo(corners.topRight.x * this.canvas.width, (1 - corners.topRight.y) * this.canvas.height);
		this.ctx.lineTo(corners.bottomRight.x * this.canvas.width, (1 - corners.bottomRight.y) * this.canvas.height);
		this.ctx.lineTo(corners.bottomLeft.x * this.canvas.width, (1 - corners.bottomLeft.y) * this.canvas.height);
		this.ctx.lineTo(corners.topLeft.x * this.canvas.width, (1 - corners.topLeft.y) * this.canvas.height);
		this.ctx.stroke();

		this.ctx.beginPath();
//		this.ctx.strokeStyle = "rgb(100, 0, 0)";
//		this.ctx.setLineDash([5, 5]);
		this.ctx.moveTo(corners.topLeft.x * this.canvas.width, (1 - corners.topLeft.y) * this.canvas.height);
		this.ctx.lineTo(corners.bottomRight.x * this.canvas.width, (1 - corners.bottomRight.y) * this.canvas.height);
		this.ctx.stroke();

		this.ctx.beginPath();
//		this.ctx.strokeStyle = "rgb(100, 0, 0)";
//		this.ctx.setLineDash([5, 5]);
		this.ctx.moveTo(corners.topRight.x * this.canvas.width, (1 - corners.topRight.y) * this.canvas.height);
		this.ctx.lineTo(corners.bottomLeft.x * this.canvas.width, (1 - corners.bottomLeft.y) * this.canvas.height);
		this.ctx.stroke();

		var ldx = (corners.topLeft.x - corners.bottomLeft.x);
		var ldy = (corners.topLeft.y - corners.bottomLeft.y);

		var rdx = (corners.topRight.x - corners.bottomRight.x);
		var rdy = (corners.topRight.y - corners.bottomRight.y);

		for (var i = 0; i < 1; i = i + 0.25)
		{
			this.ctx.beginPath();
			this.ctx.moveTo((corners.bottomLeft.x + ratio(i, rr) * ldx) * this.canvas.width, (1 - (corners.bottomLeft.y + ratio(i, rr) * ldy)) * this.canvas.height);
			this.ctx.lineTo((corners.bottomRight.x + ratio(i, rr) * rdx) * this.canvas.width, (1 - (corners.bottomRight.y + ratio(i, rr) * rdy)) * this.canvas.height);
			this.ctx.stroke();
			
		}		





	}.bind(this)

	this.render = function () {

		var gl = this.gl;

		gl.clearColor(0.0, 0.0, 0.0, 0.0);
		gl.clear(this.gl.COLOR_BUFFER_BIT);

		var program;


		program = this.pictureprogram;

		// Constrain the viewport to draw into
		var middleX = gl.viewportWidth / 2;
		var middleY = gl.viewportHeight / 2;
		var offsetX = (this.renderWidth * gl.viewportWidth);
		var offsetY = (this.renderHeight * gl.viewportHeight);
		gl.viewport(middleX - offsetX / 2, middleY - offsetY / 2, offsetX, offsetY);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.useProgram(this.pictureprogram);
		gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.texCoordLocation);

		gl.drawArrays(gl.TRIANGLES, 0, 2 * 3); // Draw 2 triangles
	}

	this.savePhoto = function () {
		var dataURL = document.getElementById("outputcanvas").toDataURL("image/png");

		if (window.navigator.msSaveBlob) {
			var blob = dataURLtoBlob(dataURL);
			window.navigator.msSaveBlob(blob, 'warpedphoto.png');
		}
		else {
			var link = document.createElement("a");
			link.download = 'warpedphoto.jpg';
			link.href = dataURL;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	}


	this.handleFileSelect = function (evt) {

		document.getElementById("openphoto1").style.display = "inline";
		document.getElementById("openphoto2").style.display = "none";

		var files = evt.target.files; // FileList object

		// files is a FileList of File objects. List some properties.
		var file = files[0];

		var reader = new FileReader();

		// Closure to capture the file information.
		reader.onload = function (e) {
			//alert("result === " + this.result);
			renderer.loadImage(this.result);
		};

		// Read in the image file as a data URL.

		reader.readAsDataURL(file);

		//alert("READER!");

	}

	document.getElementById('files').addEventListener('change', this.handleFileSelect, false);


	this.openPhoto1 = function () {
		document.getElementById("openphoto1").style.display = "none";
		document.getElementById("openphoto2").style.display = "inline";
	}






}





// Program starts here
function main() {
	renderer.init();
	cornerUI.init(document.getElementById('inputcanvas'), renderer.updateCorners);
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


function loadProgram(gl, vertexshader, fragmentshader) {
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

