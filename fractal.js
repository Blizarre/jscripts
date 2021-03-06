var WebGlComponent = WebGlComponent || {};

var MINI = require('minified');
var _=MINI._, $=MINI.$, $$=MINI.$$, EE=MINI.EE, HTML=MINI.HTML;


// WebGlComponent object: take care of all the webgl shader/program handling
var g_gl;

// Values object
var g_c0;
var g_c1;
var g_brightnessValue;
var g_contrastValue;


var g_zoom; // Current zoom level 
var g_defaultPosition;
var g_position; // Position of the central point in the Fractal image

var g_brightness; // brightness passed to the fragment shader
var g_contrast; // contrast passed to the fragment shader
var g_dragOrigin; // Used during mouseDrag to remember the point of the first click
var g_cJulia; // Parameters of the Julia fractal
var g_MAX_SLIDER = 500.0; // Maximum value of the sliders, for normalization

var g_preFullscreenCanvasSize; // SIze of the webgl canvas before the user click on the full screen button

// ANIMATIONS
// From: http://stackoverflow.com/questions/16250687/should-i-use-window-webkitrequestanimationframe-instead-of-setinterval
var requestAnimationFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame;
var cancelAnimationFrame = window.cancelAnimationFrame ||
        window.webkitCancelRequestAnimationFrame || 
        window.webkitCancelAnimationFrame ||
        window.mozCancelRequestAnimationFrame || window.mozCancelAnimationFrame ||
        window.oCancelRequestAnimationFrame || window.oCancelAnimationFrame ||
        window.msCancelRequestAnimationFrame || window.msCancelAnimationFrame;
       
var g_animTime; // Frame number since the beginning of the animation
var g_requestAnimationID; // requestAnimationFrame ID



// This function will bind the uniforms from the shader program to the values of the fractal formulae.
// It is called at each image redraw
var bindValues = function (glObject, glProgram)
{
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


// Trigger a redraw of the fractal on screen
function drawFractal()
{
	g_gl.triggerDraw(bindValues);
}

// TODO: Refactoring, refactoring, refactoring !!!!
function startAnimation()
{
	g_animTime = 0;
	g_requestAnimationID = requestAnimationFrame( animationIteration );
}

function stopAnimation()
{
	// cancel the next animation Frame
	cancelAnimationFrame(g_requestAnimationID);
	g_requestAnimationID = undefined;
}

function animationIteration(time)
{
	// If the animation has not been canceled. Shouldn't be needed since stopAnimation will
	// prevent the execution of this function
	if(g_requestAnimationID !== undefined)
	{
		// This is ugly, should be able to do this with g_c0.setValue()
		// TODO: link data with Value object
		g_cJulia[0] += 0.0001 * Math.cos(1.2 * time / 10000);
		g_cJulia[1] -= 0.0001 * Math.sin(0.7 * time / 10000);
	
		g_c0.changeValue(g_cJulia[0]);
		g_c1.changeValue(g_cJulia[1]);
	
		g_animTime += 1;
		drawFractal();
		g_requestAnimationID = requestAnimationFrame( animationIteration );
	}
}


// The Value represent a value, and make the glue between the html slider elements and
// the internal values. Every time the user or the code change a value on any of the Value, 
// all elements should be updated. Currently the element "id" (should be a slider) and "id_value"
// a text field.
// Since the slider is an integer, the value for this Value is normalized between min and max
// TODO: The real value is not embedded into the Value object, but update through the callBackList. Should be changed
function Value(id, callBackList, min, max)
{
	this.ref = $(id);
	this.refTxt = $(id + '_value');

	this.min = min;
	this.max = max;
	this.range = this.max - this.min;
	this.callBackList = callBackList;
	
	registerEvent(this, this.ref, true);
	registerEvent(this, this.refTxt, false);
}

function registerEvent(value, minifiedItem, shouldNormalize)
{
	minifiedItem.on('change', function()
	{
		value.changeValue(parseFloat(minifiedItem.get('value')), shouldNormalize);
	});
}


Value.prototype.changeValue = function(value, shouldNormalize)
{
	var normValue;
	var sliderValue;
	if(shouldNormalize)
	{
		sliderValue = value;
		normValue = (this.range * value/g_MAX_SLIDER) + this.min;
	}
	else
	{
		sliderValue = g_MAX_SLIDER * (value - this.min ) / this.range;	
		normValue = value;
	}
	
	this.refTxt.set('value', normValue.toFixed(2));
	this.ref.set('value', sliderValue);
	_.each(this.callBackList, function(item) { item(normValue) });
	drawFractal();
};

///////////////// Event handling with the DOM


// Execute when all assets (html + js) are loaded by the browser
// TODO: make this list smaller, refactoring needed
$(function()
{
	
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

$('#stopAnimate').on('click', function()
{
	stopAnimation();
	$('#animate').show();
	$('#stopAnimate').hide();
});


$('#animate').on('click', function()
{
	startAnimation();
	$('#stopAnimate').show();
	$('#animate').hide();
});


$('#fullscreen').on('click', function()
{
	g_preFullscreenCanvasSize = g_gl.getCanvasSize();
	g_gl.resizeCanvas({x:screen.availWidth, y:screen.availHeight});
	// From: https://developer.mozilla.org/fr/docs/Web/Guide/DOM/Using_full_screen_mode
	var canvas =$$("#fractalCanvas"); 
	if (canvas.requestFullscreen) {
	  canvas.requestFullscreen();
	} else if (canvas.msRequestFullscreen) {
	  canvas.msRequestFullscreen();
	} else if (canvas.mozRequestFullScreen) {
	  canvas.mozRequestFullScreen();
	} else if (canvas.webkitRequestFullscreen) {
	  canvas.webkitRequestFullscreen();
	}
	drawFractal();
});

// Detect when the user exit fullscreen : Inspired from http://stackoverflow.com/questions/10706070/how-to-detect-when-a-page-exits-fullscreen
$(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange', function()      {       
  var isFullScreen = (document.webkitIsFullScreen || document.mozFullScreen || ( document.msFullscreenElement !== undefined && document.msFullscreenElement !== null ) );
  if (! isFullScreen )
   { 
        g_gl.resizeCanvas(g_preFullscreenCanvasSize);
        drawFractal();
   }
});


$("#fractalCanvas").on('mousedown', function(evt)
{
	log("Begin Dragging");
	g_dragOrigin = {x:evt.clientX, y:evt.clientY, orig_pos:g_position.slice(0)};
});

$("#fractalCanvas").on('mouseup', function(a)
{
	log("Stop Dragging");
	g_dragOrigin = undefined;
});

$("#fractalCanvas").on('wheel', function(wheelEvt)
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

$("#fractalCanvas").on('mousemove', function(a)
{
	if(g_dragOrigin)
	{
		g_position = g_dragOrigin.orig_pos.slice(0);
		g_position[0] += (a.clientX - g_dragOrigin.x)/g_zoom;
		g_position[1] -= (a.clientY - g_dragOrigin.y)/g_zoom;
		drawFractal();
	}
});

// Get a context from our canvas object with id = "fractalCanvas".
g_brightness = $("#brightness").get('value');
g_cJulia = [];
g_zoom = 256.0;
g_requestAnimationID = undefined;
// Set the maximum value for a slider. They should all have the same max value
g_MAX_SLIDER = $$('#brightness').max;

// center fractal on canvas
g_defaultPosition = [0, 0];
g_position = g_defaultPosition.slice(0);


log("Starting");
g_gl = new WebGlComponent('#fractalCanvas', '#vertexShader', '#fractal', log);
g_gl.resizeCanvas({x:window.screen.availWidth - 20, y:512});

drawFractal();


// TODO: make an object
$('#highQuality').on('change', function() { drawFractal(); } ) ;

g_c0 = new Value('#c0', [ function(value) { g_cJulia[0] = value } ], -1, 1);
g_c1 = new Value('#c1', [ function(value) { g_cJulia[1] = value } ], -1, 1);
g_brightnessValue = new Value('#brightness', [ function(value) { g_brightness = value } ], -1.5, 1);
g_contrastValue = new Value('#contrast', [ function(value) { g_contrast = value } ], 0, 10);

g_c0.changeValue(-0.76);
g_c1.changeValue(-0.08);
g_brightnessValue.changeValue(-0.6);
g_contrastValue.changeValue(0.3);

});