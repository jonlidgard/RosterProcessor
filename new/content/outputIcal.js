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
        i = 0;
        
    function outputHeader()
    {
        // MS Outlook doesn't like V2.0 of ical spec so use v1.0 for windows machines
        var calHeader;
        switch (BrowserDetect.OS)
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
                break;
        }
        outputText = outputText.concat(calHeader);
    }
    function outputFooter()
    {
        outputText = outputText.concat(ICAL.CAL_FOOTER);
    }
    /*
    function outputEvent(e)
    { 
        var mySector,crewLine,firstSector = true;

        if ( e.showSectors() )
        {
            for ( mySector in e.sectors )
            {
                with (theEvent.sectors[mySector])
                {
                    outputText = outputText.concat(ICAL.EVENT_HEADER);
                    outputText = outputText.concat('CREATED:' + getCreated() + "\n");
                    outputText = outputText.concat('LAST_MODIFIED:' + getLastModified() + "\n");
                    outputText = outputText.concat('DTSTAMP:' + getDtStamp() + "\n");
                    outputText = outputText.concat('UID:' + getUUID() + "\n");
                    if ( firstSector )
                    {
                        crewLine = " " + abbrevName(crewList);
// Mod 0.1.25 - need to switch between L & Z for cc or fc rosters
//                        rptText = "RPT" + theEvent.startTime.toISO8601String(7,false) + "Z ";
                        rptText = '';
                        outputText = outputText.concat('DTSTART' + TZID + theEvent.getStartTime() + "\n");
                    }
                    else
                    {
                        rptText = '';
                        crewLine = '';
                    }
                    outputText = outputText.concat('DTSTART' + TZID + getStartTime() + "\n");
                    firstSector = false;
                    outputText = outputText.concat('DTEND' + TZID + getEndTime() + "\n");
                    outputText = outputText.concat('SUMMARY:' + rptText + getSummary() + crewLine + "\n");
                    outputText = outputText.concat('DESCRIPTION:' + getDescription() + "\n");
                    outputText = outputText.concat('CATEGORIES:' + categories + "\n");
                    outputText = outputText.concat(ICAL.EVENT_FOOTER);
                }
            }
        }
        else
        {
        if( e.showEvent() )
        {
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
        }
        }
    }
    */
    // Add the header
    outputHeader();
    // Add the events

    for ( ;i < events.length; i += 1 )
    {
 //       outputEvent(events[i]);
    }

    outputFooter();
    return outputText;




};
