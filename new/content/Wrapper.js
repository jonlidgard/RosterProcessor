/**
 * RosterProcessor Extension
 *
 * @module rosterProcessor
 */

/*jslint white: false, devel: true */

"use strict";

/*
var RP = RP || {
    VERSION : '0.3',
    myRoster : null,
    ICAL_EXT : '.ics',
    RP_EMAIL : 'rosterprocessor@gmail.com',
    RP_STATEMENTS_URL : 'https://crewlink.baplc.com/crewlink/portal.jsp',
    RP_HELP_URL : 'http://www.aircrewrosters.com/help.html'
};

RP.namespace = function (ns_string) {
    var parts = ns_string.split('.'), parent = RP, i;
    // strip redundant leading global
    if (parts[0] === "RP") {
        parts = parts.slice(1);
    }
    for (i = 0; i < parts.length; i += 1) {
        // create a property if it doesn't exist
        if (typeof parent[parts[i]] === "undefined") {
            parent[parts[i]] = {};
        }
        parent = parent[parts[i]];
    }
    return parent;
};
*/
YUI().add('rpWrapper', function (Y) {
    Y.namespace('rp');

Y.rp = {
    
    // Constants
    constants : {
        VERSION : '0.3',

        ICALNS : 'urn:ietf:params:xml:ns:xcal',
        IROSTER : 'http://www.myflightcrewroster.com/xroster',
        ICAL_EXT : '.ics',

        RP_EMAIL : 'rosterprocessor@gmail.com',
        RP_STATEMENTS_URL : 'https://crewlink.baplc.com/crewlink/portal.jsp',
        RP_HELP_URL : 'http://www.aircrewrosters.com/help.html',

        WHOLEDAY : +86400000,
        ONEMINUTE : +60000,
        POSTFLIGHTDUTYTIME : +1800000, // 1/2 hour
        PREFLIGHTDUTYTIME : +3600000, // 1 hour
        MINREST : +39600000, // 11 hours

        DAYSOFWEEK : ["SU","MO","TU","WE","TH","FR","SA"],
        MONTHSOFYEAR : ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]
    },

    // vars    
    myRoster : null,

    /**
     * General initialisations
     *
     *
     */
    init : function () {
        Y.rp.utils.init();
//        this.rosterTypes = [BaFcRoster, BaCcRoster];
    },

    /**
     * Prepends an error message with 'RosterProcessor' ident
     *
     * @param {string} message - The error message.
     */
    RosterException : function (message) {
        this.errorText = message;
        this.name = "RosterProcessor: ";
        this.toString = function () {
            return this.name + ': "' + this.message + '"';
        };
        
    },


    /**
     * Determines the type of roster in myRoster.rosterText
     *
     * @returns {object} theRoster- BaFcRoster, BaCcRoster, undefined
     */
    
    isValidRoster : function () {
        var i = this.rosterTypes.length, theRoster;
        while (i--) {
            try {
                theRoster = new this.rosterTypes[i]();
                theRoster.getRosterInfo();
                break;
            } catch (err) {
                theRoster = undefined;
            }
        }
        return (theRoster);
    },


    /**
     * Converts & saves the roster to an ical file
     *
     */
    onSaveAsCal: function () {

        // Grab a copy of the roster
        var _valid_Roster = this.isValidRoster(this.myRoster);
        if (_valid_Roster === undefined) {
            this.myRoster = new Roster();
            this.myRoster.text.all = rp_getContentDocument().body.textContent;
            if (this.isvalidRoster(this.myRoster) === undefined) {
                alert("Unrecognised roster");
                return;
            }
        }
    
    },


    parseRoster : function () {
   //     this.init();
        var lines = document.getElementById("roster").innerHTML,
            roster = new Y.rp.Roster(lines),
            parser = new Y.rp.Parser(roster);
        parser.parse();
    }




};
}, '0.1', {use: ['rpUtils', 'rpParser']} );

/*  onSaveAsCal: function() {
    // Set to the os home directory
  var myRoster = new roster();
      myRoster.text.all = rp_getContentDocument().body.textContent;
      if (!isvalidRoster(myRoster)) {
        alert("Unrecognised roster");
        return;
      }
    }
    
    var rt = (myRoster instanceof BaFcRoster) ? 1 : 0;
      rt = (myRoster instanceof BaCcRoster) ? 2 : rt;

      if (myRoster.parsePage(myRoster)) {
        var icalText = outputICAL(myRoster);
        dump("\n" + icalText + "\n");
        var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
        fp.defaultString = myRoster.getFileName() + icalExt;
      }
*/    