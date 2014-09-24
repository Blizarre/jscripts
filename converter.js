var binary = document.getElementById("binary");
var octal = document.getElementById("octal");
var decimal = document.getElementById("decimal");
var hexadecimal = document.getElementById("hexadecimal");
var g_origColor;

binary.addEventListener("keyup", binChange, false); 
octal.addEventListener("keyup", octChange, false); 
decimal.addEventListener("keyup", decChange, false); 
hexadecimal.addEventListener("keyup", hexChange, false); 

var g_allChar = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];


function convert(text, baseFrom, baseTo)
{
    var curAllowedChar = g_allChar.slice(0, baseFrom);
    var isValidString = true;
    var i, res;
    
    isValidString = (text.length > 0);
    
    for(i=0; i< text.length; i++)
    {
        if(curAllowedChar.indexOf(text[i].toLowerCase()) === -1 )
        {
            isValidString = false;
        }
    }
    
    if(isValidString)
    {
        res = parseInt(text, baseFrom).toString(baseTo);
        resetColor();
    }
    else
    {
        res = null;
        changeColor("red");
    }

    return res;
    
}

function resetColor(color)
{
    if(g_origColor !== undefined)
    {
        decimal.style.background = g_origColor;
        octal.style.background = g_origColor;
        hexadecimal.style.background = g_origColor;
        binary.style.background = g_origColor;
    }
}


function changeColor(color)
{
    if(g_origColor === undefined)
    {
        g_origColor = binary.style.background;
    }
    decimal.style.background = color;
    octal.style.background = color;
    hexadecimal.style.background = color;
    binary.style.background = color;
}



function updateAll(decValue)
{
    if(decValue !== null)
    {
        decimal.value = decValue;
        
        hexadecimal.value = convert(decValue, 10, 16);
        octal.value = convert(decValue, 10, 8);
        binary.value = convert(decValue, 10, 2);
    }
}


function hexChange()
{
    var text = hexadecimal.value;
    updateAll(convert(text, 16, 10));
}

function decChange()
{
    var text = decimal.value;
    updateAll(text);
}            

function octChange()
{
    var text = octal.value;
    updateAll(convert(text, 8, 10))
}    

function binChange()
{
    var text = binary.value;
    updateAll(convert(text, 2, 10))
}
