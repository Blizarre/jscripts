var WebGlComponent = WebGlComponent || {};

var MINI = require('minified');
var _=MINI._, $=MINI.$, $$=MINI.$$, EE=MINI.EE, HTML=MINI.HTML;


var g_zoom
var g_defaultPosition;
var g_position;
var g_brightness;
var g_contrast;
var g_glContext;
var g_dragOrigin;
var g_canvas;
var g_cJulia;
var g_animTime;

$(function()
{
	

var bindValues = function (glObject, glProgram)
{
// look up where the vertex data needs to go.
		var cJulia = glObject.getUniformLocation(glProgram, "u_cJulia");
		var move = glObject.getUniformLocation(glProgram, "u_fractalPosition");
		var zoom = glObject.getUniformLocation(glProgram, "u_fractalZoom");
		var brightness = glObject.getUniformLocation(glProgram, "u_brightness");
		var contrast = glObject.getUniformLocation(glProgram, "u_contrast");
		var highQuality = glObject.getUniformLocation(glProgram, "u_highQuality");
		var qual = ($('#highQuality').get('checked') === true ? 1 : 0);
		glObject.uniform2f(cJulia, g_cJulia[0], g_cJulia[1]);
		glObject.uniform1f(zoom, g_zoom);
		glObject.uniform1i(highQuality, qual );
		glObject.uniform2f(move, g_position[0] + 0.5 * glObject.drawingBufferWidth / g_zoom, g_position[1] + 0.5 * glObject.drawingBufferHeight / g_zoom);
		glObject.uniform1f(brightness, g_brightness);
		glObject.uniform1f(contrast, g_contrast);
};


var g_gl = new WebGlComponent('#fractalCanvas', '#vertexShader', '#fractal', log);

function drawFractal()
{
	g_gl.triggerDraw(bindValues);
}

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



$('#small').on('click', function()
{
	g_gl.resizeCanvas({x:256, y:256});
	drawFractal();
});

$('#medium').on('click', function()
{
	g_gl.resizeCanvas({x:512, y:512});
	drawFractal();
});

$('#maximum').on('click', function()
{
	g_gl.resizeCanvas({x:screen.availWidth, y:screen.availHeight});
	drawFractal();
});

$('#reset').on('click', function()
{
	$('#logger').fill();
	g_position = g_defaultPosition.slice(0);
	drawFractal();
});

$('#animate').on('click', function()
{
	startAnimation();
});

$('#fullscreen').on('click', function()
{
	g_gl.resizeCanvas({x:screen.availWidth, y:screen.availHeight});
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
	drawFractal();
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
	drawFractal();
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
	drawFractal();
});

g_canvas.on('mousemove', function(a)
{
	if(g_dragOrigin)
	{
		g_position = g_dragOrigin.orig_pos.slice(0);
		g_position[0] += (a.clientX - g_dragOrigin.x)/g_zoom;
		g_position[1] -= (a.clientY - g_dragOrigin.y)/g_zoom;
		drawFractal();
	}
});


log("Starting");

g_gl.resizeCanvas({x:window.screen.availWidth - 20, y:512});

drawFractal();


// TODO: make object
$('#highQuality').on('change', function() { drawFractal(); } ) ;

var g_c0 = new Control('#c0', [ function(value) { g_cJulia[0] = value } ], -1, 1, g_glContext);
var g_c1 = new Control('#c1', [ function(value) { g_cJulia[1] = value } ], -1, 1, g_glContext);
var g_brightnessControl = new Control('#brightness', [ function(value) { g_brightness = value } ], -1, 1, g_glContext);
var g_contrastControl = new Control('#contrast', [ function(value) { g_contrast = value } ], 0, 10, g_glContext);

g_c0.changeValue(-0.76);
g_c1.changeValue(-0.08);
g_brightnessControl.changeValue(-0.6);
g_contrastControl.changeValue(0.3)
});