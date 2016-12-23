'use strict';

window.onload = getVRDisplays;

var canvas;
var gl;
var program;
var vertexBuffer;
var indicesBuffer;

var textureCoordsBuffer;

var vrDisplay = null;

var videoElement;
var videoTexture;
var frameData;

var doVideo = true;

var frameCounter = 0;

var fpsData = "";

var previousVideoUploadTime = performance.now();

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


function getProgram(gl, vertexshader, fragmentshader) {
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

	gl.useProgram(program);


	return program;
};


function getBuffer(data, shaderName, itemSize) {
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

	buffer.itemSize = itemSize;
	buffer.count = data.length / buffer.itemSize;

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

	buffer.shaderReference = gl.getAttribLocation(program, shaderName);

	gl.enableVertexAttribArray(buffer.shaderReference);

	//console.log(shaderName + " " + buffer.count + ' items ' + buffer.itemSize + ' size ' + buffer.shaderReference);

	return buffer;
}

function init() {


	gl.viewport(0, 0, canvas.width, canvas.height);


	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	// Shaders
	var vertexShader = getShader(gl, 'vertex-shader');
	var fragmentShader = getShader(gl, 'fragment-shader');
	program = getProgram(gl, vertexShader, fragmentShader);

	// Buffers
	var cubeVertices = [
		1, -1, 1,
		-1, -1, 1,
		-1, 1, 1,

		1, 1, 1,
		-1, -1, -1,
		1, -1, -1,

		1, 1, -1,
		-1, 1, -1,
		1, 1, -1,

		1, 1, 1,
		-1, 1, 1,
		-1, 1, -1,

		-1, -1, -1,
		-1, -1, 1,
		1, -1, 1,

		1, -1, -1,
		1, -1, -1,
		1, -1, 1,

		1, 1, 1,
		1, 1, -1,
		-1, -1, 1,

		-1, -1, -1,
		-1, 1, -1,
		-1, 1, 1
	];
	vertexBuffer = getBuffer(cubeVertices, 'aVertexPosition', 3);
	gl.vertexAttribPointer(vertexBuffer.shaderReference, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

	var textureCoords = [
		0.001667,
		0.5025,
		0.331667,
		0.5025,
		0.331667,
		0.9975,
		0.001667,
		0.9975,
		0.335,
		0.5025,
		0.665,
		0.5025,
		0.665,
		0.9975,
		0.335,
		0.9975,
		0.668333,
		0.5025,
		0.998333,
		0.5025,
		0.998333,
		0.9975,
		0.668333,
		0.9975,
		0.001667,
		0.0025,
		0.331667,
		0.0025,
		0.331667,
		0.4975,
		0.001667,
		0.4975,
		0.335,
		0.0025,
		0.665,
		0.0025,
		0.665,
		0.4975,
		0.335,
		0.4975,
		0.668333,
		0.0025,
		0.998333,
		0.0025,
		0.998333,
		0.4975,
		0.668333,
		0.4975
	];
	textureCoordsBuffer = getBuffer(textureCoords, 'aTextureCoord', 2);

	gl.vertexAttribPointer(textureCoordsBuffer.shaderReference, textureCoordsBuffer.itemSize, gl.FLOAT, false, 0, 0); //bugbug move


	indicesBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);

	indicesBuffer.itemSize = 1;
	indicesBuffer.count = 36;

	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 2, 1, 0, 3, 2, 4, 6, 5, 4, 7, 6, 8, 10, 9, 8, 11, 10, 12, 14, 13, 12, 15, 14, 16, 18, 17, 16, 19, 18, 20, 22, 21, 20, 23, 22]), gl.STATIC_DRAW);


	// Video texture

	videoTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, videoTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

	//var videoElement = document.getElementById('sourcevideo');
	//videoElement.setAttribute('crossorigin', 'anonymous');

	//videoElement.src = 'video.mp4';

	//videoElement.load(); // must call after setting/changing source
	//videoElement.play();

	//gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoElement);
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	//gl.bindTexture(gl.TEXTURE_2D, null);





	if (true === doVideo) {
		videoElement = document.getElementById('sourcevideo');
		gl.bindTexture(gl.TEXTURE_2D, videoTexture);
		//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);


		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, videoTexture);
		gl.uniform1i(gl.getUniformLocation(program, 'uSampler'), 0);

	}


	if (vrDisplay == null) {
	}
	else {
		frameData = new VRFrameData();
	}

	vrDisplay.resetPose();

}

function setMat4(id, a, b) {
	var location = gl.getUniformLocation(program, id);
	if (location == null) {
		alert('LOCATION NULL'); ///TODO
	}

	gl.uniformMatrix4fv(location, a, b);
}

function drawGeometry() {
	// /gl.clearColor(1.0, 0.5, 0.5, 0.5);


	/*	
		setMat4('uPMatrix', false, new Float32Array([0.866, 0.0, 0.0, 0.0,
									0.0, 1.732, 0.0, 0.0,
									 0.0, 0.0, -1.0, -1.0,
									  0.0, 0.0, 0.2, 0.0]));
	*/
	/*
		setMat4('uMVMatrix', false, new Float32Array([-0.08, 0.09, -0.99, 0,
									  0, 0.995, 0.099, 0,
									   0.99, 0.008, -0.08, 0,
										0, 0, 0, 1]));
	*/
	/*
	 setMat4('uMVMatrix', false, new Float32Array([1, 0, 0, 0,
													   0, 1, 0, 0,
														   0, 0, 1, 0,
												   0, 0, 0, 1]));
 */
	/*
	
	
	*/




	//bugbug only do this sample once


	gl.drawElements(gl.TRIANGLES, indicesBuffer.count, gl.UNSIGNED_SHORT, 0);

}

function onVRFrame() {

	var t0 = performance.now();

	if (vrDisplay == null) {
		window.requestAnimationFrame(onVRFrame);
	}
	else {
		vrDisplay.requestAnimationFrame(onVRFrame);
	}

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


	var uploaded = false;

	if (true === doVideo) {
		var thisVideoUploadTime = t0;

		if (thisVideoUploadTime - previousVideoUploadTime > 33.33333) // aka 30fps (1000ms / 30 fps)
		{
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, videoElement);
			//gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1024, 1024, gl.RGBA, gl.UNSIGNED_BYTE, videoElement);

			//void texImage2D(enum target, int level, enum internalformat, enum format, enum type, Object object)
			//void texSubImage2D(enum target, int level, int xoffset, int yoffset, long width, long height, enum format, enum type, Object pixels)

			previousVideoUploadTime = thisVideoUploadTime;
			uploaded = true;
			//fpsData += ('frame upload<br />');

		}

	}

	var leftPM;
	var leftVM;
	var rightPM;
	var rightVM;

	if (vrDisplay == null) {
		/*
		leftPM = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
		leftVM = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
		rightPM = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
		rightVM = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
		*/

		leftPM = [0.757, 0.000, 0.000, 0.000, 0.000, 0.681, 0.000, 0.000, -0.056, -0.002, -1.000, -1.000, 0.000, 0.000, -0.020, 0.000];
		leftVM = [0.938, -0.191, -0.288, 0.000, 0.215, 0.975, 0.052, 0.000, 0.271, -0.111, 0.956, 0.000, 0.667, -0.028, -0.361, 1.000];
		rightPM = [0.757, 0.000, 0.000, 0.000, 0.000, 0.682, 0.000, 0.000, 0.056, 0.005, -1.000, -1.000, 0.000, 0.000, -0.020, 0.000];
		rightVM = [0.938, -0.191, -0.288, 0.000, 0.215, 0.975, 0.052, 0.000, 0.271, -0.111, 0.956, 0.000, 0.603, -0.028, -0.361, 1.000];

	}
	else {
		vrDisplay.getFrameData(frameData);



		leftPM = frameData.leftProjectionMatrix;
		leftVM = frameData.leftViewMatrix;
		rightPM = frameData.rightProjectionMatrix;
		rightVM = frameData.rightViewMatrix;
	}

	// Center
	leftVM[12] = 0;
	leftVM[13] = 0;
	leftVM[14] = 0;

	rightVM[12] = 0;
	rightVM[13] = 0;
	rightVM[14] = 0;

	/*
		var log = document.getElementById('log');
	
		var d = 2;
	
		log.innerHTML = (frameData.leftViewMatrix[0].toFixed(d) + " " 
					  + frameData.leftViewMatrix[1].toFixed(d) + " " 
					  + frameData.leftViewMatrix[2].toFixed(d) + " "
					  + frameData.leftViewMatrix[3].toFixed(d)) +
					  + " | "
					  + (frameData.leftViewMatrix[4].toFixed(d) + " " 
					  + frameData.leftViewMatrix[5].toFixed(d) + " " 
					  + frameData.leftViewMatrix[6].toFixed(d) + " "
					  + frameData.leftViewMatrix[7].toFixed(d)) +
					  + " | "
					  + frameData.leftViewMatrix[8].toFixed(d) + " " 
					  + frameData.leftViewMatrix[9].toFixed(d) + " " 
					  + frameData.leftViewMatrix[10].toFixed(d) + " "
					  + frameData.leftViewMatrix[11].toFixed(d) +
					  + " | "
					  + frameData.leftViewMatrix[12].toFixed(d) + " " 
					  + frameData.leftViewMatrix[13].toFixed(d) + " " 
					  + frameData.leftViewMatrix[14].toFixed(d) + " "
					  + frameData.leftViewMatrix[15].toFixed(d); */

	/*
    if (navigator.getVRDisplays)
	{

		setMat4('uPMatrix', false, frameData.leftProjectionMatrix);
		setMat4('uMVMatrix', false, frameData.leftViewMatrix);
	}
	else
	{

	}
*/

	/*
		  setMat4('uPMatrix', false, new Float32Array([1, 0, 0, 0,
														0, 1, 0, 0,
															0, 0, 1, 0,
													0, 0, 0, 1]));
  
		  setMat4('uMVMatrix', false, new Float32Array([1, 0, 0, 0,
														0, 1, 0, 0,
															0, 0, 1, 0,
													0, 0, 0, 1]));	
													*/

	// Render to the left eye’s view to the left half of the canvas
	gl.viewport(0, 0, canvas.width * 0.5, canvas.height);
	setMat4('uPMatrix', false, leftPM);
	setMat4('uMVMatrix', false, leftVM);
	drawGeometry();


	// Render to the right eye’s view to the right half of the canvas
	gl.viewport(canvas.width * 0.5, 0, canvas.width * 0.5, canvas.height);
	setMat4('uPMatrix', false, rightPM);
	setMat4('uMVMatrix', false, rightVM);
	drawGeometry();


	// Indicate that we are ready to present the rendered frame to the VRDisplay
	//bugbug vrDisplay.submitFrame();
	//window.requestAnimationFrame(onFrame);
	if (vrDisplay != null) {
		vrDisplay.submitFrame();
	}

	var t1 = performance.now();

	var t = (t1 - t0).toFixed(4);



	frameCounter++;
	if (frameCounter <= 1000) {

		if (uploaded == true) {
			fpsData += (t + '*<br />');
		}
		else {
			fpsData += (t + '<br />');
		}

		if (frameCounter == 1000) log(fpsData);
	}

}




function getVRDisplays() {
	if (navigator.getVRDisplays) {
		navigator.getVRDisplays().then(function (displays) {
			if (displays.length > 0) {
				vrDisplay = displays[0];
			}
		})
	}
	else {
		// no VRDisplay, fake items
		vrDisplay = FakeWebVR.getVRDisplay();
	}

}

function enterVR() {
	
	canvas = document.getElementById('webglcanvas');
	//gl = canvas.getContext('experimental-webgl');
	gl = canvas.getContext("experimental-webgl", {
		alpha: false,
		preserveDrawingBuffer: false,
		depth: false,
		stencil: false,
		antialias: false,
		premultipliedAlpha: true
	});




	if (vrDisplay == null) {
		init();
		window.requestAnimationFrame(onVRFrame);
	}
	else {
		vrDisplay.requestPresent([{ source: canvas }]).then(function () {
			init();
			vrDisplay.requestAnimationFrame(onVRFrame);
		});
	}


	// Begin presentation (must be called within a user gesture)

}

