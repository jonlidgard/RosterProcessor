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
        u = YAHOO.rp.utils;

    this.outputHeader = function() {
        // MS Outlook doesn't like V2.0 of ical spec so use v1.0 for windows machines
        var calHeader;
        switch (u.BrowserDetect.OS)
        {
            case 'Windows':
                calHeader = ICAL.V1_HEADER + TZINFO;
                break;
            case 'Mac':
                calHeader = ICAL.V2_HEADER + TZINFO;
                break;
            case 'Linux':
                calHeader = ICAL.V2_HEADER + TZINFO;
                break;
            default:
                calHeader = ICAL.V2_HEADER + TZINFO;
                break;
        }
        outputText = outputText.concat(calHeader);
    };

    this.outputFooter = function() {
        outputText = outputText.concat(ICAL.CAL_FOOTER);
    };

    this.outputSector = function (s) {
        outputText += ICAL.EVENT_HEADER +
            'CREATED:' + getCreated() + '\n' +
            'LAST_MODIFIED:' + getLastModified() + '\n' +
            'DTSTAMP:' + getDtStamp() + '\n' +
            'UID:' + getUUID() + '\n';

        if ( firstSector ) {
            crewLine = " " + abbrevName(crewList);
            //  rptText = "RPT" + theEvent.startTime.toISO8601String(7,false) + "Z ";
            rptText = '';
            outputText += 'DTSTART' + TZID + theEvent.getStartTime() + '\n';
        }
        else {
            rptText = '';
            crewLine = '';
        }
        firstSector = false;
        outputText += 'DTSTART' + TZID + getStartTime() + '\n' +
            'DTEND' + TZID + getEndTime() + '\n' +
            'SUMMARY:' + rptText + getSummary() + crewLine + '\n' +
            'DESCRIPTION:' + getDescription() + '\n' +
            'CATEGORIES:' + categories + '\n' + ICAL.EVENT_FOOTER;
    };

    this.outputDuty = function() {
        outputText += ICAL.EVENT_HEADER;
        outputText += 'CREATED:' + e.getCreated() + "\n";
        outputText += 'LAST-MODIFIED:' + e.getLastModified() + "\n";
        outputText += 'DTSTAMP:' + e.getDtStamp() + "\n";
        outputText += 'UID:' + e.getUUID() + "\n";
        outputText += 'DTSTART' + TZID + e.getStartTime() + "\n";
        outputText += 'DTEND' + TZID + e.getEndTime() + "\n";
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
    };

    this.outputEvent = function(e) {
        var mySector,crewLine,firstSector = true;

        if (e.name === 'trip') {
            switch (preferences.detailLevel) {
                case 'showSectors':
                    while (e.duties.events.hasNext()) {
                        d = e.duties.events.next();
                        while (d.sectors.hasNexy()) {
                            s = d.sectors.events.next();
                            this.outputSectors(s);
                        }
                    }
                    break;

                case 'showDuty':
                    while (e.duties.events.hasNext()) {
                        d = e.duties.events.next();
                        this.outputDuties(d);
                    }
                    break;
                case 'showTrip':
                    this.outputTrip(e);
                    break;
                case 'showAtWork':
                    this.outputAtWork(e);
                    break;
            }
        }
        else {
            this.outputDuty(e);
        }
    }
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
