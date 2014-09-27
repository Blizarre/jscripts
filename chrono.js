var MINI = require('minified');
var _=MINI._, $=MINI.$, $$=MINI.$$, EE=MINI.EE, HTML=MINI.HTML;


// Date() at the beginning of the measured time
var g_origin = null;

// Date() since last Step
var g_lastStep =null

// Id of the window.setInterval Call
var g_idInterval;

var entries;
var counter;


// Beginning of program, set variables and Event handling
$( function()
{
    entries = $$("#entries");
    counter = $$("#counter");
     
    $('#step').on('click', step);
    $('#reset').on('click', reset);
    
    // TODO: Refactor with a real object Timer
    $('#start').on('click',
        function()
        {
            if(g_idInterval === undefined)
            {
                start();
            }
            else
            {
                step(); // Show the last time
                stop();
            }
        }
    );
});


function fmtTime(t)
{
    return (t / 1000.0).toFixed(2);
}

function start() 
{
    g_origin = new Date();
    g_lastStep = g_origin;
    entries.value += "" + fmtDate(g_origin) + "\n"
    if(g_idInterval === undefined)
    {
        g_idInterval = window.setInterval(update, 200);
    }
    $('#start').fill("Stop");
    update()
}

function stop() 
{
    window.clearInterval(g_idInterval);
    g_lastStep = undefined;
    g_origin = undefined;
    g_idInterval = undefined;
    $('#start').fill("Start");
    update();
}

function update()
{
    var diff;
    if(g_origin !== undefined)
    {
        diff = new Date() - g_origin;
        counter.firstChild.nodeValue = fmtTime(diff);
    }
    else
    {
        counter.firstChild.nodeValue = " ---- ";
    }
}

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

function fmtDate(d) { return pad(d.getHours(),2) + ":" + pad(d.getMinutes(),2) + ":" + pad(d.getSeconds(), 2); }

function step()
{
    if(g_origin !== undefined)
    {
        var newStep = new Date()
        entries.value += "" + fmtDate(newStep) + "; " + fmtTime(newStep -  g_origin)
        entries.value += ";  " + fmtTime(newStep - g_lastStep) + "\n"
        g_lastStep = newStep;
        update()
    }
}

function reset()
{
    stop();
    entries.value = "";
}      

