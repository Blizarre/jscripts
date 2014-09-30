// This function will create a default scene (a plane facing the camera), and load 
// vertex and fragment shaders from the DOM.
// This code has been heavily "borrowed" from the internet
function WebGlComponent(idCanvas, idVertexShader, idFragmentShader, log)
{
  this.logFunction = log;
  this.canvas = $$(idCanvas);
	try {
		// minifiedList[0] to get access to the raw DOM Object
		this.glContext = this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl");
	}
	catch (e) {
		this.logFunction("canvas getContext fail");
	}
	try
	{
		// setup a GLSL program
		this.vertexShader = this.getShaderFromDOM($$(idVertexShader));
		this.fragmentShader = this.getShaderFromDOM($$(idFragmentShader));
		this.loadProgram(this.glContext, this.vertexShader, this.fragmentShader);
	}
	catch (e) {
	// Display the fail on the screen if the shaders/program fail.
	this.logFunction('initFractal fail: ' + e.message);
	}
}


// Draw the WebGL 3D Data. 
// - registerVariables: function(WebGlComponent) : make link between data and shaders (uniforms, attribute...)
WebGlComponent.prototype.triggerDraw = function(registerVariables)
{
	var a = new Date();
	try
	{
		this.glContext.useProgram(this.glProgram);

    registerVariables(this.glContext, this.glProgram);

		// Create a buffer and put a single clipspace rectangle in
		// it (2 triangles)
		var buffer = this.glContext.createBuffer();
		this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, buffer);
		this.glContext.bufferData(
			this.glContext.ARRAY_BUFFER, 
			new Float32Array([
				-1.0, -1.0, 
				 1.0, -1.0, 
				-1.0,  1.0, 
				-1.0,  1.0, 
				 1.0, -1.0, 
				 1.0,  1.0]), 
			this.glContext.STATIC_DRAW);
			
		var positionLocation = this.glContext.getAttribLocation(this.glProgram, "a_position");
		this.glContext.enableVertexAttribArray(positionLocation);
		this.glContext.vertexAttribPointer(positionLocation, 2, this.glContext.FLOAT, false, 0, 0);

		// draw
		this.glContext.drawArrays(this.glContext.TRIANGLES, 0, 6);
		this.glContext.finish();
	}
	catch (e) {
		this.logFunction('drawFractal fail: ' + e.message);
	}
	return (new Date() - a);
};


// get compiled code from this.vertexShader and this.fragmentShader, and link them in a program.
// Return true on success, false on error.
WebGlComponent.prototype.loadProgram = function()
{
  // create a progam object
  this.glProgram = this.glContext.createProgram();

  // attach the two shaders 
  this.glContext.attachShader(this.glProgram, this.vertexShader);
  this.glContext.attachShader(this.glProgram, this.fragmentShader);

  // link everything 
  this.glContext.linkProgram(this.glProgram);

  // Check the link status
  var linked = this.glContext.getProgramParameter(this.glProgram, this.glContext.LINK_STATUS);
  if (!linked) {

    // An error occurred while linking
    var lastError = this.glContext.getProgramInfoLog(this.glProgram);
    this.logFunction("Error in program linking:" + lastError);

    this.glContext.deleteProgram(this.glProgram);
    return false;
  }
  return true;
};


// Loads a shader from a script tag
// Parameters:
//   id of script element containing the shader to load
WebGlComponent.prototype.getShaderFromDOM = function(id) {
  var shaderScript = $$(id);

  // error - element with supplied id couldn't be retrieved
  if (!shaderScript) {
    this.logFunction("couldn't find " + id);
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
    shader = this.glContext.createShader(this.glContext.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = this.glContext.createShader(this.glContext.VERTEX_SHADER);
  } else {
  	this.logFunction("unknown type for " + id);
    return null;
  }

  this.glContext.shaderSource(shader, str);
  this.glContext.compileShader(shader);

  // Check the compile status, return an error if failed
  if (!this.glContext.getShaderParameter(shader, this.glContext.COMPILE_STATUS)) {
    this.logFunction("Error compiling shader " + id + ": " + this.glContext.getShaderInfoLog(shader));
    return null;
  }

  return shader;
};


WebGlComponent.prototype.resizeCanvas = function(newSize)
{
	this.logFunction("Resize webgl canvas to " + newSize.x + ", " + newSize.y);
	this.canvas.width = newSize.x;
	this.canvas.height = newSize.y;
	this.glContext.viewport(0, 0, newSize.x, newSize.y);
}