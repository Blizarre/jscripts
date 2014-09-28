var MINI = require('minified');
var _=MINI._, $=MINI.$, $$=MINI.$$, EE=MINI.EE, HTML=MINI.HTML;


var g_zoom
var g_program;
var g_defaultPosition;
var g_position;
var g_brightness;
var g_glContext;
var g_dragOrigin;
var g_canvas;
var g_cJulia;
var g_animTime;

$(function()
{
	

// Get a context from our canvas object with id = "fractalCanvas".
g_canvas = $("#fractalCanvas");
g_brightness = $("#brightness").get('value');
g_cJulia = [];
g_zoom = 256.0;



// center fractal on canvas
g_defaultPosition = [0, 0];
g_position = g_defaultPosition.slice(0);




// TODO: Refactoring, refactoring, refactoring !!!!

/////////////////////////// LOGGER ///////////////////////////
$("#showLog").on('change', function()
{
	if(this.get('checked') === true)
		$("#logger").show();
	else
		$("#logger").hide();
});

$("#showLog").set('checked', false);
$("#logger").hide();

function log(msg) { $('#logger').add(msg + '\n'); }

function resizeCanvas(gl, newSize)
{
	log("Resize webgl canvas to " + newSize.x + ", " + newSize.y);
	g_canvas.set('width', newSize.x);
	g_canvas.set('height', newSize.y);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	drawFractal(g_glContext);
}

$('#small').on('click', function()
{
	resizeCanvas(g_glContext, {x:256, y:256});
});

$('#medium').on('click', function()
{
	resizeCanvas(g_glContext, {x:512, y:512});
});

$('#maximum').on('click', function()
{
	resizeCanvas(g_glContext, {x:screen.availWidth, y:screen.availHeight});
});

$('#reset').on('click', function()
{
	$('#logger').fill();
	g_position = g_defaultPosition.slice(0);
	drawFractal(g_glContext);
});

$('#animate').on('click', function()
{
	startAnimation();
});

$('#fullscreen').on('click', function()
{
	resizeCanvas(g_glContext, {x:screen.availWidth, y:screen.availHeight});
	// From: https://developer.mozilla.org/fr/docs/Web/Guide/DOM/Using_full_screen_mode
	var canvas =$$("#fractalCanvas"); 
	if (canvas.requestFullscreen) {
	  canvas.requestFullscreen();
	} else if (canvas.mozRequestFullScreen) {
	  canvas.mozRequestFullScreen();
	} else if (canvas.webkitRequestFullscreen) {
	  canvas.webkitRequestFullscreen();
	}
});


function startAnimation()
{
	g_animTime = 0;
	window.setInterval( animationIteration, 10 );
}

function animationIteration()
{
	var val_c0 = Math.sin(1.2 * g_animTime / 360.0);
	var val_c1 = Math.cos(0.7 * g_animTime / 360.0);
	//g_zoom += 10 * (Math.cos(g_animTime / 360.0) - Math.cos((g_animTime - 1) / 360.0) );

	g_c0.changeValue(val_c0);
	g_c1.changeValue(val_c1);
  //	g_brightnessControl.changeValue(val_brght);
	
	g_animTime += 1;
	drawFractal(g_glContext);
}

function Control(id, callBackList, min, max, gl)
{
	this.ref = $(id);
	this.refTxt = $(id + '_value');

	this.min = min;
	this.max = max;
	this.range = this.max - this.min;
	this.glContext = gl;
	this.callBackList = callBackList;
	
	registerEvent(this, this.ref);
}

function registerEvent(control, minifiedItem)
{
	minifiedItem.on('change', function()
	{
		control.changeValue(minifiedItem.get('value'), true);
	});
}

Control.prototype.changeValue = function(value, shouldNormalize)
{
	var normValue;
	var sliderValue;
	
	if(shouldNormalize)
	{
		sliderValue = value;
		normValue = (this.range * value/100.0) + this.min;
	}
	else
	{
		sliderValue = 100.0 * (value - this.min ) / this.range;	
		normValue = value;
	}
	
	this.refTxt.set('value', normValue.toFixed(2));
	this.ref.set('value', sliderValue);
	_.each(this.callBackList, function(item) { item(normValue) });
	drawFractal(this.glContext);
};



g_canvas.on('mousedown', function(evt)
{
	log("Begin Dragging");
	g_dragOrigin = {x:evt.clientX, y:evt.clientY, orig_pos:g_position.slice(0)};
});

g_canvas.on('mouseup', function(a)
{
	log("Stop Dragging");
	g_dragOrigin = undefined;
});

g_canvas.on('wheel', function(wheelEvt)
{
	if(wheelEvt.deltaY < 0)
	{
		g_zoom *= 1.1;
	}
	else
	{
		g_zoom /= 1.1;
	}
	drawFractal(g_glContext);
});

g_canvas.on('mousemove', function(a)
{
	if(g_dragOrigin)
	{
		g_position = g_dragOrigin.orig_pos.slice(0);
		g_position[0] += (a.clientX - g_dragOrigin.x)/g_zoom;
		g_position[1] -= (a.clientY - g_dragOrigin.y)/g_zoom;
		drawFractal(g_glContext);
	}
});



function loadProgram(gl, vertexShader, fragmentShader)
{
  // create a progam object
  var program = gl.createProgram();

  // attach the two shaders 
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  // link everything 
  gl.linkProgram(program);

  // Check the link status
  var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {

    // An error occurred while linking
    var lastError = gl.getProgramInfoLog(program);
    log("Error in program linking:" + lastError);

    gl.deleteProgram(program);
    return null;
  }

  // if all is well, return the program object
  return program;
}


// Loads a shader from a script tag
// Parameters:
//   WebGL context
//   id of script element containing the shader to load
function getShader(gl, id) {
  var shaderScript = $$(id);

  // error - element with supplied id couldn't be retrieved
  if (!shaderScript) {
    log("couldn't find " + id);
  }

  // If successful, build a string representing the shader source
  var str = "";
  var k = shaderScript.firstChild;
  while (k) {
    if (k.nodeType == 3) {
      str += k.textContent;
    }
    k = k.nextSibling;
  }

  var shader;

  // Create shaders based on the type we set
  //   note: these types are commonly used, but not required
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
	log("unknown type for " + id);
    return null;
  }

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  // Check the compile status, return an error if failed
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    log("Error compiling shader " + id + ": " + gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}


function initFractal()
{
	try {
		// minifiedList[0] to get access to the raw DOM Object
		g_glContext = g_canvas[0].getContext("webgl") || g_canvas[0].getContext("experimental-webgl");
	}
	catch (e) {
		log("canvas getContext fail");
	}

	try
	{
		// setup a GLSL program
		var vertexShader = getShader(g_glContext, "#vertexShader");
		var fragmentShader = getShader(g_glContext, "#fractal");
		g_program = loadProgram(g_glContext, vertexShader, fragmentShader);
	}
	catch (e) {
	// Display the fail on the screen if the shaders/program fail.
	log('initFractal fail: ' + e.message);
	}
}


function drawFractal(gl)
{
	var a = new Date()
	try
	{
		gl.useProgram(g_program);

		// look up where the vertex data needs to go.
		var positionLocation = gl.getAttribLocation(g_program, "a_position");
		var cJulia = gl.getUniformLocation(g_program, "u_cJulia");
		var move = gl.getUniformLocation(g_program, "u_fractalPosition");
		var zoom = gl.getUniformLocation(g_program, "u_fractalZoom");
		var brightness = gl.getUniformLocation(g_program, "u_brightness");
		var highQuality = gl.getUniformLocation(g_program, "u_highQuality");
		var qual = ($('#highQuality').get('checked') === true ? 1 : 0);
		gl.uniform2f(cJulia, g_cJulia[0], g_cJulia[1]);
		gl.uniform1f(zoom, g_zoom);
		gl.uniform1i(highQuality, qual );
		gl.uniform2f(move, g_position[0] + 0.5 * gl.drawingBufferWidth / g_zoom, g_position[1] + 0.5 * gl.drawingBufferHeight / g_zoom);
		gl.uniform1f(brightness, g_brightness);
			
			
			
		// Create a buffer and put a single clipspace rectangle in
		// it (2 triangles)
		var buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(
			gl.ARRAY_BUFFER, 
			new Float32Array([
				-1.0, -1.0, 
				 1.0, -1.0, 
				-1.0,  1.0, 
				-1.0,  1.0, 
				 1.0, -1.0, 
				 1.0,  1.0]), 
			gl.STATIC_DRAW);
		gl.enableVertexAttribArray(positionLocation);
		gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

		// draw
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		gl.finish();
	}
	catch (e) {
		log('drawFractal fail: ' + e.message);
	}
	log("time: " + (new Date() - a) + " ms. position: " + g_position)

}


log("Starting");

initFractal();

resizeCanvas(g_glContext, {x:window.screen.availWidth - 20, y:512});

drawFractal(g_glContext);


// TODO: make object
$('#highQuality').on('change', function() { drawFractal(g_glContext); } ) ;

var g_c0 = new Control('#c0', [ function(value) { g_cJulia[0] = value } ], -1, 1, g_glContext);
var g_c1 = new Control('#c1', [ function(value) { g_cJulia[1] = value } ], -1, 1, g_glContext);
var g_brightnessControl = new Control('#brightness', [ function(value) { g_brightness = value } ], 1, 300, g_glContext);

g_c0.changeValue(-0.76);
g_c1.changeValue(-0.08);
g_brightnessControl.changeValue(4);



});