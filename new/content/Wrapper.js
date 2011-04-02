/**
 * RosterProcessor Extension
 *
 * @module rosterProcessor
 */


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

YAHOO.rosterProcessor = {
    VERSION : '0.3',
    myRoster : null,
    ICAL_EXT : '.ics',
    RP_EMAIL : 'rosterprocessor@gmail.com',
    RP_STATEMENTS_URL : 'https://crewlink.baplc.com/crewlink/portal.jsp',
    RP_HELP_URL : 'http://www.aircrewrosters.com/help.html',


    /**
     * General initialisations
     *
     *
     */
    init : function () {
        this.rosterTypes = [BaFcRoster, BaCcRoster];
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
        var lines = document.getElementById("roster").innerHTML,
            roster = new YAHOO.rosterProcessor.Roster(lines),
            parser = new YAHOO.rosterProcessor.parser(roster);
        parser.parse();
    }




};


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