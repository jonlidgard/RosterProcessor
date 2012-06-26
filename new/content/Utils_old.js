/* Copyright (c) 2006 YourNameHere
   See the file LICENSE.txt for licensing information. */


YAHOO.rosterProcessor.utils = {
    
//--- Helper Functions ---
    
    init : function() {
        
        // Add the Object.create function
        if (typeof Object.create !== 'function') {
            Object.create = function (o) {
                function F() {}
                F.prototype = o;
                return new F();
            };
        }
    
        if (typeof String.trim !== 'function') {
            String.prototype.trim = function () { 
                return this.replace(/^\s+|\s+$/g,"");
            }
        }
    
    /* Returns a date as hh:mm, where hh shows total hours
        e.g. 3 days would be returned as 72:00
    */
        if (typeof Date.getHHMM !== 'function') {
            Date.prototype.getHHMM = function(separator,round) {
                var dutyHrs,dutyMins;
        
                separator = separator || ':';
        
                if (round === true) {
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
        }
    
        if (typeof Date.setHHMM !== 'function') {
            Date.prototype.setHHMM = function(timeString,useLocalTime) {
                var hrs,
                    mins;
            
                mins = +timeString;
            
                if (isNaN(mins) ||
                    (mins < 0) ||
                    (mins > 2359)) {
                    throw new TypeError("setHHMM: Invalid time string");
                }

                hrs = Math.floor(mins/100);
                mins = mins - (hrs*100);
                
                /* Update the time in HHMM format */
                if (useLocal === true) {
                    this.setHours(hrs);
                    this.setMinutes(mins);
                }
                else {
                    this.setUTCHours(hrs);
                    this.setUTCMinutes(mins);
                }
            }
        }
    },
    
    isDate : function (theDate) {
        return ( theDate !== undefined && typeof theDate.getUTCMonth ==='function');
    },
    
    sendToWeb : function (url,request,callback,errorMsg) {
        var http = new XMLHttpRequest(),
            mode = request ? "POST":"GET";
    
        http.open(mode,url,true);
    
        if (mode=="POST") {
            http.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
        }
        http.onreadystatechange = function(aEvt) {
            if (http.readyState===4) {
                if (http.status === 200) {
                    callback(http.responseText);
                }
                else {
                    if (errorMsg != "") {
                        alert(errorMsg);
                    }
                }
            }
        }        
        http.onerror = function(e) {
            alert(errorMsg + "(" + e.target.status + ").");
        }
        http.send(request);
    },

    // Validate email address
    checkEmail : function (str) {
        var filter=/^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
        return (filter.test(str));
    },

    // Returns the current content document
    getContentDocument : function () {
        return window.top.getBrowser().browsers[window.top.getBrowser().mTabBox.selectedIndex].contentDocument;
    },

    // Get the text from the browser window
    getContentTitle : function () {
        return window.top.getBrowser().browsers[window.top.getBrowser().mTabBox.selectedIndex].contentTitle;
    },

    indexOfMonth : function (shortMonth) {
        // returns month index or -1 if no match
        var monthNo = YAHOO.rosterProcessor.constants.MONTHSOFYEAR.indexOf(shortMonth.toUpperCase());
        if (monthNo === -1)  {
            throw new TypeError("indexOfMonth, Invalid input: " + shortMonth);
        }
        return monthNo;
    },
        
    daysInMonth : function (sMonth, iYear) {
        var days = 32 - new Date(sMonth + " 32 " + iYear).getDate();
        if (isNaN(days))  {
            throw new TypeError("daysInMonth, Invalid input: " + sMonth + ", " + iYear);
        }
        return days;
    },


    daysInMonth2 : function ( theDate) {
        if ( !this.isDate(theDate)) {
            throw new TypeError("daysInMonth2: Invalid date");
        };
        
        var iMonth = theDate.getUTCMonth(),
            iYear =  theDate.getUTCFullYear();
        return 32 - new Date( iYear, iMonth, 32).getDate();
    },

    daysSince1970 : function ( theDate ) {
        if ( !this.isDate(theDate)) {
            throw new TypeError("daysSince1970: Invalid date");
        };
        return (Math.floor(theDate.valueOf() / YAHOO.rosterProcessor.constants.WHOLEDAY));
    },


    timeDiff : function (d1, d2) {
        var tmp;
        if (!isDate(d1) || !isDate(d2)) {
            throw new TypeError("timeDiff: Invalid date");
        }
        
        d1 = d1.valueOf();
        d2 = d2.valueOf();
    
        if ( d1 > d2 ) {
            tmp = d2;
            d2 = d1;
            d1 = tmp;
        }
    
        return new Date(d2 - d1);
    },

    abbrevName : function (namesLine) {
        
        var fn1,
            fn2,
            ln,
            name,
            newNamesLine = '',
            nameList = namesLine.split('.');
        
        for ( var n = 0 ; n < nameList.length - 1 ; n++) {
            name = /([A-Z\-]+)\s?([A-Z\-]+)/i(nameList[n]);
            fn1 = name ? name[1] : '';
            fn2 = '';
            ln = name ? name[2] : '';
            fnsplit = /([A-Z]+)-([A-Z]+)/i(fn1);

            fn2 = fnsplit ? fnsplit[2] : '';
            fn1 = fnsplit ? fnsplit[1] : fn1;

            fn1 = typeof fn1[0] != "undefined" ? fn1[0] : '';
            fn2 = typeof fn2[0] != "undefined" ? fn2[0] : '';
            newNamesLine = newNamesLine + fn1 + fn2 + " " + ln + ". ";
        }    
        return newNamesLine.trim();
    },

    abbrevBase : function (base) {
        base = (base == 'LGW') ? 'G' : base;
        base = (base == 'LHR') ? 'L' : base;
        return base;
    },

    // Return a pseudo GUID
    generateGUID : function () {
        var result = '',
            i,
            j = 0;

        for(;j<32; j++) {
            if( j == 8 || j == 12|| j == 16|| j == 20)
            result = result + '-';
            i = Math.floor(Math.random()*16).toString(16).toUpperCase();
            result = result + i;
        }
        return result;
    },
    
    incUTCMonth : function (d) {
        d.setUTCMonth(d.getUTCMonth() + 1);
        return d;
    },
    
    decUTCMonth : function (d) {
        d.setUTCMonth(d.getUTCMonth() - 1);
        return d;
    },
 

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
/*
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
/*
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

*/  
    
}