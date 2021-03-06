/**************************************************************
This code is copyright of Jon Lidgard (jonlidgard@gmail.com).
Please do not copy, modify, or distribute without prior consent.

Version 0.1.25, April 20th, 2008.
***************************************************************/



debugger;
const ICALNS = 'urn:ietf:params:xml:ns:xcal';
const IROSTER = 'http://www.myflightcrewroster.com/xroster';
const DAYSOFWEEK = ["SU","MO","TU","WE","TH","FR","SA"];
var MONTHSOFYEAR = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

//--- Helper Functions ---


function indexOfMonth(mmm) {
    // returns month index or -1 if no match
    return MONTHSOFYEAR.indexOf(mmm.toUpperCase());
}


// Returns the current content document
function rp_getContentDocument()
{
    return window.top.getBrowser().browsers[window.top.getBrowser().mTabBox.selectedIndex].contentDocument;
}

// Get the text from the browser window
function rp_getContentTitle()
{
    return window.top.getBrowser().browsers[window.top.getBrowser().mTabBox.selectedIndex].contentTitle;
}

function LOG (errorCode, description)
{
    /*
      LOG_LEVEL = 0    :No Logging to console
      LOG_LEVEL 1 - 10 : For info console dumping.
      The higher LOG_LEVEL is set the more info gets dumped
      Error codes above THROW_EXCEPTION_ERROR_LEVEL will generate a real exception
    */
      
    if ( LOG_LEVEL > 0 )
    {
        if ( parseInt(errorCode) <= LOG_LEVEL ) {
            dump(description + "\n");
            return;
        }
    }
    if ( parseInt(errorCode) >= THROW_EXCEPTION_ERROR_LEVEL ) {
        err = new Object();
        err.errorCode = errorCode;
        err.errorText = description;
        dump("ErrorCode: " + errorCode + " :: " + description + "\n");
        throw(err);
    }
}

/* returns an object containing the args passed to the function set
    used for a = b in set(c,d,e);
*/
function set ()
{
    var result = {};

    for (var i = 0; i < arguments.length; i++)
      result[arguments[i]] = true;

    return result;
}

function trimString(str)
{
    if ( str )
    {
        str = "" + str; // force to a string;
//        return str.replace(/^\s+|\s+$/g,"");
//  Modified 0.1.25 after seeing savefolder extension code's trimString example
    return str.replace(/(^\s*)|(\s*$)/g,"");
    }
    else
    {
        return str;
    }
}



// Returns days in month (iMonth is zero base i.e. 0 = Jan)
//function daysInMonth( iMonth, iYear) { return 32 - new Date( iYear, iMonth, 32).getDate(); }
function daysInMonth( sMonth, iYear) { return 32 - new Date(sMonth + " 32 " + iYear).getDate(); }
function daysInMonth2( theDate)
{
    var iMonth = theDate.getUTCMonth();
    var iYear =  theDate.getUTCFullYear();
    return 32 - new Date( iYear, iMonth, 32).getDate();
}

function daysSince1970( theDate ) { return (Math.floor(theDate.valueOf() / WHOLEDAY)); }

function abbrevName(namesLine) // Abbreviated the home base to L or G
{
    
    if ( !rosterprocessor_getBooleanPreference("rosterprocessor.fcShowAbbrevNames", true) ) {
        return(trimString(namesLine));
    }
    
    var fn1,fn2,ln,name, newNamesLine, nameList = namesLine.split('.');
    newNamesLine = '';
    for ( var n = 0 ; n < nameList.length - 1 ; n++) {
        name = /([A-Z\-]+)\s?([A-Z\-]+)/i(nameList[n]);
        fn1 = name ? name[1] : '';
        fn2 = '';
        ln = name ? name[2] : '';
        LOG(9,"nameList[n]: " + nameList[n] + " fn1: " + fn1 + ", fn2: " + fn2 + " ,ln: " + ln);
        fnsplit = /([A-Z]+)-([A-Z]+)/i(fn1);

        fn2 = fnsplit ? fnsplit[2] : '';
        fn1 = fnsplit ? fnsplit[1] : fn1;

        LOG(9,"fn1: " + fn1 + ", fn2: " + fn2 + " ,fn1[0]: " + fn1[0] + ", fn2[0]: " + fn2[0]);
        fn1 = typeof fn1[0] != "undefined" ? fn1[0] : '';
        fn2 = typeof fn2[0] != "undefined" ? fn2[0] : '';
        LOG(9,"fn1: " + fn1 + ", fn2: " + fn2);
        newNamesLine = newNamesLine + fn1 + fn2 + " " + ln + ". ";
        LOG(9,"newNamesLine: " + newNamesLine);
    }    
    return trimString(newNamesLine);
}

function abbrevBase(base) // Abbreviated the home base to L or G
{
    base = (base == 'LGW') ? 'G' : base;
    base = (base == 'LHR') ? 'L' : base;
    return base;
}

Date.prototype.toHHMMString = function(separator,round)
{
        /* Returns a date as hh:mm, where hh shows total hours
          e.g. 3 days would be returned as 72:00
        */
        if (!separator)
        {
            separator = ':';
        }
        var dutyHrs,dutyMins;
        
        if (round) {
            dutyHrs = this.getUTCHours();
            dutyMins = this.getUTCMinutes();
        }
        else {
            dutyMins = Math.floor(this.getTime() / (60 * 1000));
            dutyHrs = Math.floor(dutyMins / 60);
            dutyMins = dutyMins - (dutyHrs * 60);
        }

        dutyHrs = (dutyHrs < 10) ? "0" + dutyHrs : dutyHrs;
        dutyMins = (dutyMins < 10) ? "0" + dutyMins : dutyMins;
        return( dutyHrs + separator + dutyMins);
}


Date.prototype.setHHMMTime = function(newTime, useLocal)
{
    newTime = newTime.replace(/^\s*(\d{1,4})\s*$/,"$1");
    if (!/^\d{1,4}$/(newTime))
    {
        dump("Invalid time passed to setHHMMTime:" + newTime + "_\n");
        throw("Invalid variable passed to setHHMMTime");
    }
    
    while (newTime.length < 4) //zeropad out a time of 959 or less to 0959
    {
        newTime = "0" + newTime;
    }
    /* Update the time in HHMM format */
    if ( useLocal )
    {
//    dump("Setting Local Time:" + newTime  + "\n");
    this.setHours(newTime.slice(0,2));
    this.setMinutes(newTime.slice(2,4));
    }
    else
    {
//    dump("Setting UTC Time:" + newTime  + "\n");
    this.setUTCHours(newTime.slice(0,2));
    this.setUTCMinutes(newTime.slice(2,4));
    }
}

Date.prototype.incUTCMonth = function () { this.setUTCMonth(this.getUTCMonth() + 1);}
Date.prototype.decUTCMonth = function () { this.setUTCMonth(this.getUTCMonth() - 1);}

Date.prototype.setISO8601 = function (string) {
    var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
        "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
        "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
    var d = string.match(new RegExp(regexp));

    var offset = 0;
    var date = new Date(d[1], 0, 1);

    if (d[3]) { date.setMonth(d[3] - 1); }
    if (d[5]) { date.setDate(d[5]); }
    if (d[7]) { date.setHours(d[7]); }
    if (d[8]) { date.setMinutes(d[8]); }
    if (d[10]) { date.setSeconds(d[10]); }
    if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
    if (d[14]) {
        offset = (Number(d[16]) * 60) + Number(d[17]);
        offset *= ((d[15] == '-') ? 1 : -1);
    }

    offset -= date.getTimezoneOffset();
    time = (Number(date) + (offset * 60 * 1000));
    this.setTime(Number(time));
}

Date.prototype.timeDiff = function (d1, d2) {

    d1 = d1.valueOf();
    d2 = d2.valueOf();
    
    if ( d1 > d2 ) {
        var tmp = d2;
        d2 = d1;
        d1 = tmp;
    }
    
    return new Date(d2 - d1);
}

Date.prototype.toShortDate = function () {
 
    var zeropad = function (num) { return ((num < 10) ? '0' : '') + num; }
    var date = this;
    var str = "";
    var sep = "/";
    
    str = zeropad(date.getUTCDate()) + sep;
    str += zeropad(date.getUTCMonth() + 1) + sep;

    var yr = date.getUTCFullYear() - 2000;
    if ( yr < 0) { yr += 100; }
    str += zeropad( yr );
    return str;
}



Date.prototype.toISO8601String = function (format, useLocal) {
    /* accepted values for the format [1-6]:
     1 Year:
       YYYY (eg 1997)
     2 Year and month:
       YYYY-MM (eg 1997-07)
     3 Complete date:
       YYYY-MM-DD (eg 1997-07-16)
     4 Complete date plus hours and minutes:
       YYYY-MM-DDThh:mmTZD (eg 1997-07-16T19:20+01:00)
     5 Complete date plus hours, minutes and seconds:
       YYYY-MM-DDThh:mm:ssTZD (eg 1997-07-16T19:20:30+01:00)
     6 Complete date plus hours, minutes, seconds and a decimal
       fraction of a second
       YYYY-MM-DDThh:mm:ss.sTZD (eg 1997-07-16T19:20:30.45+01:00)
     7 Time as HHMM
    */
    var offset = useLocal ? '' : 'Z';
    var date = this;
    if (!format) { var format = 6; }
/*
    if (!offset) {
    } else {
        var d = offset.match(/([-+])([0-9]{2}):([0-9]{2})/);
        var offsetnum = (Number(d[2]) * 60) + Number(d[3]);
        offsetnum *= ((d[1] == '-') ? -1 : 1);
        var date = new Date(Number(Number(this) + (offsetnum * 60000)));
    }
*/

    var zeropad = function (num) { return ((num < 10) ? '0' : '') + num; }

    var str = "";
    str += date.getUTCFullYear();
//    if (format > 1) { str += "-" + zeropad(date.getUTCMonth() + 1); }
//    if (format > 2) { str += "-" + zeropad(date.getUTCDate()); }
    if (format > 1) { str += zeropad(date.getUTCMonth() + 1); }
    if (format > 2) { str += zeropad(date.getUTCDate()); }
    if (format > 3) {
        str += "T" + zeropad(date.getUTCHours()) +
//               ":" + zeropad(date.getUTCMinutes());
               zeropad(date.getUTCMinutes());
    }
    if (format > 5) {
        var secs = Number(date.getUTCSeconds() + "." +
                   ((date.getUTCMilliseconds() < 100) ? '0' : '') +
                   zeropad(date.getUTCMilliseconds()));
        str += ":" + zeropad(secs);
//    } else if (format > 4) { str += ":" + zeropad(date.getUTCSeconds()); }
    } else if (format > 4) { str += zeropad(date.getUTCSeconds()); }

    if (format > 3) { str += offset; }
    if (format == 7)
    {
        if ( useLocal)
        {
            str = zeropad(date.getHours()) +
               zeropad(date.getMinutes());
        }
        else
        {
            str = zeropad(date.getUTCHours()) +
               zeropad(date.getUTCMinutes());
        }
    }
    return str;
}

// Return a pseudo GUID
function generateGUID()
{
var result, i, j;
result = '';
for(j=0; j<32; j++)
{
if( j == 8 || j == 12|| j == 16|| j == 20)
result = result + '-';
i = Math.floor(Math.random()*16).toString(16).toUpperCase();
result = result + i;
}
return result;
}

function rosterprocessor_loadURL(url)
{
    var generatedPage = null;
    var request       = new XMLHttpRequest();

    // If the open tabs preference is set to true
    if ( rosterprocessor_getBooleanPreference("rosterprocessor.helpOpenTab", true))
    {
        getBrowser().selectedTab = getBrowser().addTab(url);

        generatedPage = window;
    }
    else
    {
        generatedPage = window.open(url);
    }

    // This must be done to make generated content render
    request.open("get", "about:blank", false);
    request.send("");

    return generatedPage.content.document;
}



var BrowserDetect = {
	init: function () {
		this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
		this.version = this.searchVersion(navigator.userAgent)
			|| this.searchVersion(navigator.appVersion)
			|| "an unknown version";
		this.OS = this.searchString(this.dataOS) || "an unknown OS";
	},
	searchString: function (data) {
		for (var i=0;i<data.length;i++)	{
			var dataString = data[i].string;
			var dataProp = data[i].prop;
			this.versionSearchString = data[i].versionSearch || data[i].identity;
			if (dataString) {
				if (dataString.indexOf(data[i].subString) != -1)
					return data[i].identity;
			}
			else if (dataProp)
				return data[i].identity;
		}
	},
	searchVersion: function (dataString) {
		var index = dataString.indexOf(this.versionSearchString);
		if (index == -1) return;
		return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
	},
	dataBrowser: [
		{ 	string: navigator.userAgent,
			subString: "OmniWeb",
			versionSearch: "OmniWeb/",
			identity: "OmniWeb"
		},
		{
			string: navigator.vendor,
			subString: "Apple",
			identity: "Safari"
		},
		{
			prop: window.opera,
			identity: "Opera"
		},
		{
			string: navigator.vendor,
			subString: "iCab",
			identity: "iCab"
		},
		{
			string: navigator.vendor,
			subString: "KDE",
			identity: "Konqueror"
		},
		{
			string: navigator.userAgent,
			subString: "Firefox",
			identity: "Firefox"
		},
		{
			string: navigator.vendor,
			subString: "Camino",
			identity: "Camino"
		},
		{		// for newer Netscapes (6+)
			string: navigator.userAgent,
			subString: "Netscape",
			identity: "Netscape"
		},
		{
			string: navigator.userAgent,
			subString: "MSIE",
			identity: "Explorer",
			versionSearch: "MSIE"
		},
		{
			string: navigator.userAgent,
			subString: "Gecko",
			identity: "Mozilla",
			versionSearch: "rv"
		},
		{ 		// for older Netscapes (4-)
			string: navigator.userAgent,
			subString: "Mozilla",
			identity: "Netscape",
			versionSearch: "Mozilla"
		}
	],
	dataOS : [
		{
			string: navigator.platform,
			subString: "Win",
			identity: "Windows"
		},
		{
			string: navigator.platform,
			subString: "Mac",
			identity: "Mac"
		},
		{
			string: navigator.platform,
			subString: "Linux",
			identity: "Linux"
		}
	]

};
BrowserDetect.init();

function sendToWeb(url,request,callback,errorMsg)
{
    var http = new XMLHttpRequest();
    var mode = request?"POST":"GET";
    http.open(mode,url,true);
    if(mode=="POST"){http.setRequestHeader('Content-Type','application/x-www-form-urlencoded');}
    http.onreadystatechange=function(aEvt)
    {
        if(http.readyState==4)
        {
            if(http.status == 200)
            {
                callback(http.responseText);
            }
            else
            {
                if ( errorMsg != "" )
                {
                    alert(errorMsg);
                }
            }
        }
    }        
    http.onerror=function(e)
    {
      alert(errorMsg + "(" + e.target.status + ").");
    }
    http.send(request);
}

// Validate email address
function checkEmail(str){
    var filter=/^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return (filter.test(str));
}

