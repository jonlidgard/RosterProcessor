/*globals YAHOO */

/*jslint white: false, devel: true */

"use strict";

/* For description of 'that' & it's use in inheritance, see
  Doug Crockford JS 3 - Functions video at yui theater
*/
YAHOO.rp.outputIcal = function (events, preferences) {

    var ICAL =   {V1_HEADER:'BEGIN:VCALENDAR\nVERSION:1.0\nPRODID:-//www.aircrewrosters.com/NONSGML Roster Calendar V0.1.23//EN\n',
                V2_HEADER:'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//www.aircrewrosters.com/NONSGML Roster Calendar V0.1.23//EN\n',
                TIMEZONE_INFO:'BEGIN:VTIMEZONE\nTZID:/aircrewrosters.com/20070129_1/Europe/London\nX-LIC-LOCATION:Europe/London\nBEGIN:DAYLIGHT\nTZOFFSETFROM:+0000\nTZOFFSETTO:+0100\nTZNAME:BST\nDTSTART:19700329T010000\nRRULE:FREQ=YEARLY;INTERVAL=1;BYDAY=-1SU;BYMONTH=3\nEND:DAYLIGHT\nBEGIN:STANDARD\nTZOFFSETFROM:+0100\nTZOFFSETTO:+0000\nTZNAME:GMT\nDTSTART:19701025T020000\nRRULE:FREQ=YEARLY;INTERVAL=1;BYDAY=-1SU;BYMONTH=10\nEND:STANDARD\nEND:VTIMEZONE\n',
                CAL_FOOTER:'END:VCALENDAR\n',
                EVENT_HEADER:'BEGIN:VEVENT\n',
                EVENT_FOOTER:'END:VEVENT\n',
                TZIDcode: ';VALUE=DATE;TZID=/www.aircrewrosters.com/20070129_1/Europe/London:'},
        rptText = "",
        outputText = "",
        TZID = preferences.useUTC ? ":" : ICAL.TZIDcode,
        TZINFO = preferences.useUTC ? ICAL.TIMEZONE_INFO : "",
        event,
        i = 0,
        u = YAHOO.rp.utils,

        outputIcalHeader = function() {
        // MS Outlook doesn't like V2.0 of ical spec so use v1.0 for windows machines
        var calHeader;
        switch (preferences.icalVersion)
        {
            case 1:
                calHeader = ICAL.V1_HEADER + TZINFO;
                break;
            case 2:
                calHeader = ICAL.V2_HEADER + TZINFO;
                break;
        }
        outputText = outputText.concat(calHeader);
    },

    outputIcalFooter = function() {
        outputText = outputText.concat(ICAL.CAL_FOOTER);
    },

    addIcalEvent = function(e) {
        outputText += ICAL.EVENT_HEADER;
        outputText += 'CREATED:' + e.created.ISO8601DateTime() + "\n";
        outputText += 'LAST-MODIFIED:' + e.lastModified.ISO8601DateTime() + "\n";
        outputText += 'DTSTAMP:' + e.dtStamp.ISO8601DateTime() + "\n";
        outputText += 'UID:' + e.uuid + "\n";
        outputText += 'SUMMARY:' + e.getSummary() + "\n";
//        outputText += 'DESCRIPTION:' + e.getDescription() + "\n";
        outputText += 'DESCRIPTION:' + e.rosterLine + "\n";
        if (e.isWholeDay()) {
            outputText += 'DTSTART' + TZID + e.start.ISO8601Date() + "\n";
            outputText += 'DTEND' + TZID + e.end.ISO8601Date() + "\n";
            outputText += "TRANSP:TRANSPARENT\n";
        } else {
            outputText += 'DTSTART' + TZID + e.start.ISO8601DateTime() + "\n";
            outputText += 'DTEND' + TZID + e.end.ISO8601DateTime() + "\n";
        }
        if( e.categories != "")
        {
            outputText += 'CATEGORIES:' + e.categories + "\n";
        }
        outputText += ICAL.EVENT_FOOTER;
    },

    outputSector = function (s) {
        addIcalEvent(s);
    },

    outputDuty = function(e) {
        addIcalEvent(e);
    },

    outputEvent = function(e) {
        var mySector,crewLine,firstSector = true,d,s;

        if (e.name === 'trip') {
            switch (preferences.detailLevel) {
                case 'showSector':
                    while (e.duties.hasNext()) {
                        d = e.duties.next();
                        while (d.sectors.hasNext()) {
                            s = d.sectors.next();
                            outputSector(s);
                        }
                    }
                    break;

                case 'showTrip':
                    this.outputTrip(e);
                    break;
                case 'showAtWork':
                    this.outputAtWork(e);
                    break;
                default:
                    while (e.duties.hasNext()) {
                        d = e.duties.next();
                        outputDuty(d);
                    }
                    break;

            }
        }
        else {
            outputDuty(e);
        }
    };
    // Add the header
//    outputIcalHeader();
    // Add the events

    for ( ;i < events.length; i += 1 )
    {
        outputEvent(events[i]);
    }

    outputIcalFooter();
    return outputText;




};
