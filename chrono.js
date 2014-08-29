var g_origin = null;
var g_lastStep =null
var entries = document.getElementById("entries");
var counter = document.getElementById("counter");
var g_idInterval;

function fmtTime(t)
{
    return (t / 1000.0).toFixed(2);
}

function start() 
{
    g_origin = new Date();
    g_lastStep = g_origin;
    entries.value += "" + fmtDate(g_origin) + "\n"
    update()
    if(g_idInterval === undefined)
    {
        g_idInterval = window.setInterval(update, 200);
    }

}

function update()
{
    if(g_origin !== null)
    {
        var diff = new Date() - g_origin;
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
    if(g_origin !== null)
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
    g_origin = null;
    entries.value = "";
    window.clearInterval(g_idInterval);
    g_idInterval = undefined;
    
    update();
}      

