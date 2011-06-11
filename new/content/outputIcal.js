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
        TZID = preferences.useUTC ? ICAL.TZIDcode : ":",
        TZINFO = preferences.useUTC ? ICAL.TIMEZONE_INFO : "",
        event,
        i = 0,
        u = YAHOO.rp.utils,

        outputHeader = function() {
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

    outputFooter = function() {
        outputText = outputText.concat(ICAL.CAL_FOOTER);
    },

    outputSector = function (s) {
        outputText += ICAL.EVENT_HEADER +
            'CREATED:' + s.getCreated() + '\n' +
            'LAST_MODIFIED:' + s.getLastModified() + '\n' +
            'DTSTAMP:' + s.getDtStamp() + '\n' +
            'UID:' + s.getUUID() + '\n';
/*
        if ( firstSector ) {
            crewLine = " " + abbrevName(crewList);
            //  rptText = "RPT" + theEvent.startTime.toISO8601String(7,false) + "Z ";
            rptText = '';
            outputText += 'DTSTART' + TZID + s.start.ISO8601DateTime() + '\n';
        }
        else {
*/            rptText = '';
            crewLine = '';
 //       }
 //       firstSector = false;
        outputText += 'DTSTART' + TZID + s.start.ISO8601DateTime() + '\n' +
            'DTEND' + TZID + s.end.ISO8601DateTime() + '\n' +
            'SUMMARY:' + rptText + s.getSummary() + crewLine + '\n' +
            'DESCRIPTION:' + s.getDescription() + '\n' +
            'CATEGORIES:' + s.categories + '\n' + ICAL.EVENT_FOOTER;
    },

    outputDuty = function(e) {
        outputText += ICAL.EVENT_HEADER;
        outputText += 'CREATED:' + e.created.ISO8601DateTime() + "\n";
        outputText += 'LAST-MODIFIED:' + e.lastModified.ISO8601DateTime() + "\n";
        outputText += 'DTSTAMP:' + e.dtStamp.ISO8601DateTime() + "\n";
        outputText += 'UID:' + e.getUUID() + "\n";
        outputText += 'DTSTART' + TZID + e.start.ISO8601DateTime() + "\n";
        outputText += 'DTEND' + TZID + e.end.ISO8601DateTime() + "\n";
        outputText += 'SUMMARY:' + e.getSummary() + "\n";
        outputText += 'DESCRIPTION:' + e.getDescription() + "\n";
        if (e.isWholeDay())
        {
            outputText += "TRANSP:TRANSPARENT\n";
        }
        if( e.categories != "")
        {
            outputText += 'CATEGORIES:' + e.categories + "\n";
        }
        outputText += ICAL.EVENT_FOOTER;
    },

    outputEvent = function(e) {
        var mySector,crewLine,firstSector = true,d,s;

        if (e.name === 'trip') {
            switch (preferences.detailLevel) {
                case 'showSectors':
                    while (e.duties.events.hasNext()) {
                        d = e.duties.events.next();
                        while (d.sectors.events.hasNext()) {
                            s = d.sectors.events.next();
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
                    while (e.duties.events.hasNext()) {
                        d = e.duties.events.next();
                        outputDuty(d);
                    }
                    break;

            }
        }
        else {
            this.outputDuty(e);
        }
    };
    // Add the header
    outputHeader();
    // Add the events

    for ( ;i < events.length; i += 1 )
    {
        outputEvent(events[i]);
    }

    outputFooter();
    return outputText;




};
