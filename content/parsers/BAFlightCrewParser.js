/**************************************************************
This code is copyright of Jon Lidgard (jonlidgard@gmail.com).
Please do not copy, modify, or distribute without prior consent.

Version 0.1.25, April 20th, 2008.
***************************************************************/



debugger;

const SECTORSECTIONLENGTH = 32;

function BaFcRoster()
{
       roster.call(this);

// ---- PUBLIC FUNCTIONS ---------------------------------------------------------    
    // Returns a string to use as subject line for use when mailing roster
    this.getTitleString = function()
    {

        return( this.nameCode + ' - roster for ' + MONTHSOFYEAR[this.baseDate.getUTCMonth()] + ' ' + this.baseDate.getUTCFullYear());
    }

//  ---------------------------------------------------------
    // Returns a string to use as a filename when saving roster
    this.getFileName = function()
    {
        var monthNo = this.baseDate.getUTCMonth() + 1;
        monthNo = (monthNo < 10) ? "0" + monthNo : monthNo;
        var shortYear = this.baseDate.getUTCFullYear() - 2000;
        shortYear = (shortYear < 10) ? "0" + shortYear : shortYear;
//        dump("Month No: " + monthNo + "," + myRoster.nameCode + "," + shortYear + "\n");
       var rostype = (this.text.header.search(/[A-Z]{5}\d{6}FINAL ACH[IE]{2}VED/) != -1) ? 'A' : 'P';
       return( this.nameCode + monthNo + shortYear + rostype);
    }

    this.getRosterType = function()
    { // Returns true for an achieved roster
        return( (this.text.header.search(/[A-Z]{5}\d{6}FINAL ACH[IE]{2}VED/) != -1) ? 'ACHIEVED' : 'PLANNED');
    }
    
    function modLine(line)
    {
       line = line.replace(/^\s+|\s+$/g,"");
       line = line.replace(/\s+/g," ");
       line = line.replace(/\s+BEGIN 0001 END 2400/," DAY");
       line = line.replace(/\s+BEGIN (\d{4}) END (\d{4})/," $1Z $2Z");
       return( line );
    }

// ---- PRIVATE FUNCTIONS ---------------------------------------------------------    
    // Copies roster from web page into roster object & does some tidying up
//  ------/SplitRoster-------------------------------------------------
function splitRoster(that)
    {
        // Get the entire roster into rosterText
        var chopPattern = /^.*PRODUCED.*$/im;
        with ( that.text )
        {
            all = rp_getContentDocument().body.textContent;

       // Quick check to see if we are in a valid roster, if not crash out of routine to avoid holding up the browser.
            var matchIndex = all.search(/^ *DAY +DUTY +F[LIGHTSEQUENCE ]+$/im);
            if ( matchIndex == -1 )
            {
                throw new RosterException("Couldn't find DAY DUTY FLIGHT SEQUENCE line"); // Couldn't find DAY DUTY F line
            }


            // Look for a PRODUCED line at the top & remove all the HTML crap above it.
            if (chopPattern.test(all))
            {
                all = RegExp.rightContext;
                LOG(5,"baFcRoster.getRosterType: Found PRODUCED line");
            }
            else
            {
                LOG(5,"baFcRoster.getRosterType: Didn't find PRODUCED line");
            }

            // Remove the RosterProcessor signature line if it exists
//            all = all.replace(rosterprocessor.strings.getString("rosterFooter"),"");    
            that.removeHeaderInfo();
            // 1st remove the 0x0C char from the end of the roster text
            all = all.replace(/\x0C\s*$/,"");    
            // Now split into header, body, & footer parts

            var matchIndex = all.search(/^ *DAY +DUTY +F[LIGHTSEQUENCE ]+$/im);
            if ( matchIndex != -1 )
            {
                body = all.substring( matchIndex );
                header = all.substring( 0 , matchIndex );
            }
            else
            {
                throw new RosterException("Couldn't find DAY DUTY FLIGHT SEQUENCE line"); // Couldn't find DAY DUTY F line
            }

            matchIndex = body.search(/^\s*TRIP:?\s+CREW\s+NAMES:\s*$/im);
            if ( matchIndex != -1 )
            {
                footer = body.substring( matchIndex );
                body = body.substring( 0 , matchIndex );
            }
            else
            {   // No crew names section
                matchIndex = body.search(/^.*?REMARKS.*$/im);
                if ( matchIndex != -1 )
                {
                    footer = body.substring( matchIndex );
                    body = body.substring( 0 , matchIndex );
                }
                else // No REMARKS section
                {
                    footer = "";
                }
            }
            // Remove leading & trailing blank lines.
            all = all.replace(/^\s+|\s+$/g,"");
            header = header.replace(/^\s+/g,"");
        }

        that.addFooterInfo();
        LOG(5,"---------HEADER------------------------\n" +
                that.text.header + "\n--------BODY-------------------------\n" + 
                that.text.body + "\n----------FOOTER-----------------------\n" + 
                that.text.footer + "\n--------END-------------------------\n"
            );
    }

//  ------/SplitRoster-------------------------------------------------

//  ------getRosterInfo-------------------------------------------------
    this.getRosterInfo = function()
    {
        splitRoster(this);
        try
        {
            a = /(FINAL|ACHIEVED|ACHEIVED)\s+ROSTER/i(this.text.header);
            this.rosterType = a[1];
            a = /^([A-Z]{5})\s*(\d{6})\s*(CA|FO).+(LGW|LHR).+(\d{4})/im(this.text.header);
            this.nameCode = a[1];
            this.staffNo = a[2];
            this.crewStatus = a[3];
            this.homeBase = a[4];
            this.seniority = a[5];
            a = /[0-3][0-9]([A-Z]{3})-[0-3][0-9][A-Z]{3}\s+(20\d{2})/(this.text.header);
            this.month = a[1];
            this.year = a[2];
            this.baseDate = new Date(a[1] + " 1, " + a[2] + " 00:00:00 UTC");
    //        dump(this.baseDate + "\n");
            // Get the timestamp of when the roster was published by BA.
            a = /([0-1][0-9])\/([0-9][0-9])\/([0-9][0-9])\s+([0-2][0-9]):([0-5][0-9])/(this.text.header);
            this.created.setFullYear(2000+(a[3]-0),a[1],a[2]);
            this.created.setHours(a[4],a[5],0,0);
        
    //        a = /BLK\.\s*(\d{0,2}.\d\d)\s*$/m(this.text.header);
            a = /BLK\.\s*(\d{0,3}.\d\d)\s*$/m(this.text.header);
            var dutyHours =  "" + a ? a[1] : 0; // force a string conversion
            if (dutyHours[0] == '.')
            { // Make '.xx' become '0.xx'
                dutyHours = '0' + dutyHours;
            }
            a = /(\d{1,3})\.(\d\d)/(dutyHours);
            this.publishedDutyHours = new Date(0);
            this.publishedDutyHours.setUTCHours(parseInt(a[1]));
            this.publishedDutyHours.setUTCMinutes(parseInt(a[2]));


            LOG(6,"dutyHours:" + this.publishedDutyHours.toHHMMString() + "\n");
            this.duties = [];   
/*        if( DEBUG )
        {
            dump("\n------------\n" + this.rosterType + "\n" + this.nameCode + "\n" + this.staffNo + "\n" +
            this.crewType + "\n" + this.homeBase + "\n" + this.seniority + "\n" + this.month + "\n" +
            this.year + "\n" + this.baseDate + "\n" + this.publishedDutyHours + "\n-------------\n");
        }
    */    }       
        catch(err)
        {
/*        if( DEBUG )
        {
            dump(err + " in getBAFlightCrewRosterInfo!\n");
        }
*/
        throw new RosterException("Invalid BA Flight Crew Roster");
        }
    }
//  ------/getRosterInfo-------------------------------------------------

//  ------decodeDutyDates-------------------------------------------------
    function decodeDutyDates(that)
    {

        var matchDatesLine = /^\s*\(01\) 02  03/;
        var matchBlkLine = /BLK\.\s*\d{0,2}.\d\d/;
        var matchTripLine = /\d{4}/;
        var dutyLines = that.text.header.split('\n');
        var lineNo = 0;
        try
        {
            // The roster description lines start after the BLK. hh.mm line
            while ( ++lineNo < dutyLines.length && !matchBlkLine.exec(dutyLines[lineNo]) );
            if ( lineNo == dutyLines.length ) {
                   throw new RosterException("Unrecognized roster format, couldn't find the BLK. hours line \n" );
            }

            // Skip any whitespace lines 
            while ( ++lineNo < dutyLines.length && trimString(dutyLines[lineNo]) == '' );
            if ( lineNo == dutyLines.length ) {
                   throw new RosterException("Unrecognized roster format, couldn't find anything after the BLK. hours line \n" );
            }

            // startLine points to the start of the roster summary block
            var daysOffLine = dutyLines[lineNo];
            var startLine = lineNo;

            // Find the end of the roster summary block by looking for the (01) 02  03  04.. line
            while ( ++lineNo < dutyLines.length && !matchDatesLine.exec(dutyLines[lineNo]) );
            if ( lineNo == dutyLines.length ) {
                   throw new RosterException("Unrecognized roster format, couldn't find the (01) 02  03  04.... date line. \n" );
            }

            // endLine points to the end of the roster summary block ( the day line MO  TU  WE.. etc)
            var dateLine = dutyLines[lineNo];
            var endLine = lineNo + 1; 

            var daysLine = dutyLines[endLine];
            var tripLine = matchTripLine.exec(dutyLines[lineNo-2]) ? dutyLines[lineNo-2] : dutyLines[lineNo-3];
                LOG(9,dateLine);
                LOG(9,daysLine);
                LOG(9,tripLine);
                LOG(9,daysOffLine);

            // Find the whitespace offset from the start of the line to the (01) string in the dateLine
            var offset = dateLine.search(/ \(01\) 02  03/);
            LOG(9,"Roster Summary Block\nstartLine: " + startLine + " , endLine: " + endLine + " ,offset: " + offset);

            var myDuty,theDate,theDay,theDaysOff,theTrip,rolledOverFlag = false;
            var lastDayOfMonth = daysInMonth2(that.baseDate);
            
            for( var i = offset ; i < dateLine.length; i = i + 4)
            {
                
                theDate = dateLine.substring(i+2,i+4) -0;
                if (rolledOverFlag)
                {
                    theDate = theDate + lastDayOfMonth;
                }
                if ( !rolledOverFlag && theDate == lastDayOfMonth )
                {
                    rolledOverFlag = true;
                }

                theDay = daysLine.substring(i+2,i+4);
                theDaysOff = trimString(daysOffLine.substring(i,i+4));
                theTrip = trimString(tripLine.substring(i,i+4));


                myDuty = new baseEvent();
                myDuty.startTime = new Date(that.baseDate.valueOf());
                myDuty.startTime.setUTCDate(theDate);
                myDuty.summary = theTrip == "" ? theDaysOff : theTrip;
                LOG(9,theDate + "_" + theDay + "_" + theDaysOff + "_" + theTrip + "_" + myDuty.summary + "_");
                that.infoLines.push(myDuty);
//             dump(myDuty.startTime + " " + theDate + " , " + theDay + " , " + theDaysOff + " , " + theTrip + " " + myDuty.summary + "\n");
            }
        return theDate; // No of days of roster covers
        }
        catch (err)
        {
            theDate = 0;
            throw new RosterException("Couldn't decode duty dates!");
        }
    }
//  ------/decodeDutyDates-------------------------------------------------

//  ------getDutyHours-------------------------------------------------
    this.getDutyHours = function(publishedDuty)
    {
        /* publishedDuty is duty hours on roster as a Date object
           returns null if duty hours match else
           returns a Date object containing processed duty hours.
        */
        var dutyIndex, sectorIndex, tmpDuty, tmpSector, result;
        var dutyHoursCount = 0, firstSectorFlag = true, sectorDutyHours, firstSectorDutyHours = 0;
        var baseMonth = this.baseDate.getUTCMonth();
        var pubDutyInMs = publishedDuty.valueOf();
        
        for ( dutyIndex in this.duties )
        {
            tmpDuty = this.duties[dutyIndex];
            LOG(9,"Duty " + tmpDuty.startTime + " Summary: " + tmpDuty.getSummary());
            // If it's not a flying duty then loop
            if( !tmpDuty instanceof flyingDuty )
            {
                continue;
            }

            // Only process flying duties that start in the roster month
            dutyInRosterMonth = (tmpDuty.startTime.getUTCMonth() == baseMonth);
            if( !dutyInRosterMonth )
            {
                LOG(9,"Skipping duty " + tmpDuty.startTime);
                continue;
            }
            
            for ( sectorIndex in tmpDuty.sectors )
            {
                tmpSector = tmpDuty.sectors[sectorIndex];
                // Don't count DH sectors, etc.
                if( !tmpSector.loggable() )
                {
                    continue;
                }

                sectorDutyHours = tmpSector.endTime.getTime() - tmpSector.startTime.getTime();
                /* If we have a night duty leaving on the last night of the previous month &
                  returning on the 1st day of this month we need to discount the sector's duty hours
                  because it will have been accounted for in the previous month.
                  So we need to remember this figure for later.
                */
                if ( firstSectorFlag )
                {
                    firstSectorFlag = false;
                    if ( !tmpDuty.reportDefined )
                    {
                        // If the sector's report time was present in the roster then
                        // it isn't a returning night duty so don't discount it.
                        firstSectorDutyHours = sectorDutyHours;
                    }
                }
                dutyHoursCount = dutyHoursCount + sectorDutyHours;
                LOG(9,"Sector date: " + tmpSector.startTime + "   " + tmpSector.origin.IATA + " " + tmpSector.dest.IATA);
                LOG(9,"Sector hours: " + new Date(sectorDutyHours).toHHMMString());
                LOG(9,"Duty hrs count: " + new Date(dutyHoursCount).toHHMMString());
            }
        }
        if ( ( dutyHoursCount == pubDutyInMs ) || ( dutyHoursCount - firstSectorDutyHours == pubDutyInMs ) )
        {
            result = null;
        }
        else
        {
            result = new Date(dutyHoursCount);
        }
        return result;
    }
//  ------/getDutyHours-------------------------------------------------

//  ------parsePage-------------------------------------------------
    this.parsePage = function()
    {
        // Split the string holding the roster text into an array of individual lines
        var dutyLines = this.text.body.split('\n');

        /* Decode the days line at the top of the roster.
          This is necessary to find FDO's - Fixed Days Off (Trump days) which don't appear in the main
          DAY - DUTY sequence
        */
        var checkOffDays = new Array(decodeDutyDates(this));

    //    dump("CheckOffDays:" + checkOffDays + "\n");
        /* Create an associative array of crew names against trip numbers / dates */
        getCrewNames(this);

        var matchDate = /^ *( \d|\d\d) (MO|TU|WE|TH|FR|SA|SU) $/;
        var matchDateRange = /^ *([ \d|]\d)-([ \d|]\d) $/;
        var matchTripLine = /^([ \d]\d\d\d) (.+)$/;
        //  Match this: ' LGW 0700 0800 KEF 1120........'
        var matchFlightSector = / ([A-Z]{3}) (\d{4} )(\d{4} )?([A-Z]{3}) (\d{4})(.*)/;
        var a, b, myDuty = 0, myFlightSector, myflightCrew, dutyLine, rolledOverFlag = false, isLocalStartTime;
        var lastDayOfMonth = daysInMonth2(this.baseDate),prevDay=0;
        var datePart, dutyPart, crewLine, decodeState = 0, sectorSection, startDate, endDate, tmpDate;

        // This is the date that will have its value modified when rolling forward or back a month
        var rolloverDate = new Date(this.baseDate.valueOf());
        var tmpLine,fltSectorSection;
        var isAchievedRoster = this.getRosterType() == 'ACHIEVED';
        
// ----------- ProcessLine
/* Process Line

If a TRIP line
    For each Sector in line    
        If sector has a report time
            Finish old duty
            Start a new duty
        Else
            Make a up report time of 1 hour less than off blocks time
            If already in a duty
                Make sure its a flying duty
                If more than minrest since last sector
                    finish old duty
            If not already in a duty
                    start a new one
            Else
                Probably a returning night sector so adjust duty end time to that of new day


*/
        function processLine(that,dutyPart,wholeLine,startDate,endDate)
        {

            function getNextSector()
            {
                // Get rest of line from the startOfNextSector marker
                restOfLine = restOfLine.substring(startOfNextSector);
                // Find the next 'xxx hhmm (hhmm) yyy hhmm' point in the line
                x = restOfLine.substring(SECTORSECTIONLENGTH).search(matchFlightSector);
                // Step back 6 chars & reset the get the startOfNextSector marker to this point
                startOfNextSector = SECTORSECTIONLENGTH - 6 + x;
                // If we didn't find a next sector we must be on the last sector of the line
                if ( startOfNextSector == 25 )
                { // last sector of line
                    sectorSection = restOfLine;
                    lastSectorOfLineFlag = true;
                } // last sector of line
                else
                {
                // Otherwise chop out the sector ready for parsing    
                    sectorSection = restOfLine.substring(0,startOfNextSector);
                }
                // dump("Sector:0123456789012345678901234567890123456789012345678901234567890\n");
                // dump("restOfLine:" + restOfLine + "_\n");
            }
            function finishOldDuty()
            {
                myDuty.description = myDuty.description + "\\nCLEAR AT " +
                    myDuty.endTime.toISO8601String(7) + "Z";
/*                if ( myFlightCrew != undefined && myFlightCrew.tripNo == myDuty.tripNo )
                {
                    myDuty.crewList = myFlightCrew.names;
*/
                if ( myDuty.crewList != '' ) {
                     myDuty.description = myDuty.description + "\\nCREW: " + myDuty.crewList;
                }
                checkOffDays[myDuty.endTime.getUTCDate()] = true;
                that.duties.push(myDuty);
                myDuty = 0;
            }
            function startNewDuty()
            {
                dump("Starting new duty\n");
                myDuty = new flyingDuty(dutyPart,wholeLine,that.created);
                myDuty.tripNo = a[1];
                myDuty.startTime = new Date(startDate.valueOf());
                myDuty.startTime.setHHMMTime(b[2]);
                myDuty.endTime = new Date(myDuty.startTime.valueOf());
                myDuty.reportDefined = reportDefined;
                checkOffDays[myDuty.startTime.getUTCDate()] = true;
                myDuty.description = "TRIP: " + myDuty.tripNo + ", REPORT AT " + myDuty.startTime.toISO8601String(7) + "Z";
                myFlightCrew = that.crewList[daysSince1970(myDuty.startTime)];
                if ( myFlightCrew != undefined && myFlightCrew.tripNo == myDuty.tripNo )
                {
                    myDuty.crewList = myFlightCrew.names;
                }
                dump("fffffffffffffffffffff\n" + myDuty.startTime +  " - " + myDuty.tripNo + " - " + myDuty.summary + "\nfffffffffffffffffffff\n");       
            }

            function processFlightSector()
            {
                myFlightSector = new flightSector(that.created);
                with (myFlightSector)
                {
                    //  LGW 0100 0200 PSA 0300 FCK,SP
                    // b[1] b[2] b[3] b[4] b[5] b[6]
                    // Process the fltNoSection (1st 6 chars of sector)
                    // remove numbers & spaces from DH1234 to leave DH or LIMO|SIM etc
                    preFltCode = fltNoSection.replace(/[\d ]+$/,""); 
                    // get rid of any letters or spaces to leave a flight number
                    flightNo = fltNoSection.replace(/^[A-Z ]+/,"");
                    // dump("PREFLT:" + preFltCode + "_\nFLTNO:" + flightNo +"_\n");
                    origin.IATA = b[1];
                    // startTime & endTime are the same for a flight duty line (e.g 12 SA ....)    
                    startTime = new Date(myDuty.endTime.valueOf());
                    endTime = new Date(myDuty.endTime.valueOf());
                    startTime.setHHMMTime(b[3]);
                    if( startTime < myDuty.endTime )
                    { // startTime has run over into next day
                        startTime.setUTCDate(endTime.getUTCDate() + 1);
                        endTime.setUTCDate(endTime.getUTCDate() + 1);
                    }
                    endTime.setHHMMTime(b[5]);
                    if( endTime < startTime )
                    { // endTime has run over into next day
                        endTime.setUTCDate(endTime.getUTCDate() + 1);
                    }
                    myDuty.endTime = new Date(endTime.valueOf() + POSTFLIGHTDUTYTIME);
                    dest.IATA = b[4];
                    postFltCodes = trimString(b[6]);
                    // dump("postFltCodes:" + postFltCodes + "_\n");
                    crewList = myDuty.crewList;
                    summary = trimString(sectorSection);
                    description = trimString(sectorSection);
                    // Append sectors description to that of the whole duty
                    myDuty.description = myDuty.description + "\\n" + description;
                    if ( crewList )
                    {
                        description = description + "\\nCREW: " + myDuty.crewList;
                    }
                    /* Check off each day in the month that has been decoded
                       if at the end of it there are undecoded days then not all of the roster
                       has been decoded correctly so warn user */
                    checkOffDays[startTime.getUTCDate()] = true;
                    checkOffDays[endTime.getUTCDate()] = true;
                    // dump("checkOffDays-report:=" + checkOffDays[myDuty.startTime.getUTCDate()] + " - " + myDuty.startTime + "\n");
                    // dump("checkOffDays-startTime:=" + checkOffDays[startTime.getUTCDate()] + " - " + startTime + "\n");
                    // dump("checkOffDays-endTime:=" + checkOffDays[endTime.getUTCDate()] + " - " + endTime + "\n");
                }
                if( DEBUG )
                {
                    dump(b[1] + "\n" + b[2] + "\n" + b[3] + "\n" + b[4] + "\n" + b[5] + "\n" + b[6] + "\n" + myFlightSector.crewList + "\n------------------------\n");
                }
                myDuty.sectors.push(myFlightSector);
            }
//            dump("-------------\n" + dutyPart + "\n" + wholeLine + "\n" + startDate + "\n" + endDate + "\n----------------\n");

            // Call processLine with a dutyPart of '' to wrap up last duty
            // with the above call to finishOldDuty(), then exit.
            // This is done after the last iteration of the roster lines.
            if ( dutyPart == '' )
            {
                if (myDuty != 0)
                {
                    finishOldDuty();
                }
                return;
            }

            var a, foundMatch=false;
            var x, reportDefined;
            if ((a = matchTripLine.exec(dutyPart)) != null)
            { // matchTripLine regExp
                var startOfNextSector = 0;
                var restOfLine = a[2];
                var lastSectorOfLineFlag = false;
                do
                {   // process sectors
                    getNextSector();
                    if ((b = matchFlightSector.exec(sectorSection)) != null)
                    { // matchFlightSector rexexp

                        //  LGW 0100 0200 PSA 0300 FCK,SP
                        // b[1] b[2] b[3] b[4] b[5] b[6]
                        // Grab the flight number / DH / LIMO /SM code section at the start of a sector
                        var fltNoSection = sectorSection.substring(0,6);
//                        dump("Sector:0123456789012345678901234567890123456789012345678901234567890\n");
//                        dump("startOfNextSector:" + startOfNextSector + "\nsectorSection:" + sectorSection +"_\nfltNoSection:" + fltNoSection + "_\n");
//                         dump(b[1] + "\n" + b[2] + "\n" + b[3] + "\n" + b[4] + "\n" + b[5] + "\n" + b[6] + "\n" + b[7] + "\n------------------------\n");

                        // Check to see if a sector includes a report time
                        // If it does it is the first sector of a new duty
                        // If it doesn't it could still be the 1st sector because Achieved rosters dont include
                        // the report time.
                        if ( b[3] == undefined ) 
                        { // not a report sector
                            reportDefined = false;
//                            dump("No Report, make up a false one\n");
//                          b[2] = start time & b[3] is undefined - so copy b[2] into b[3] & make b[2] 1 hour less
                            b[3] = b[2];
                            b[2] = b[2] - 100;
                            // check for rollback into previous day e.g. 0030 - 0100 -> 2330
                            if ( b[2] < 0)
                            { // range check
                                b[2] = b[2] + 2400;
                            }
                            // force conversion back to a string
                            b[2] = b[2] + "";
                            if ( myDuty != 0 )
                            { // No Report, Already in a duty
                                if ( !myDuty instanceof flyingDuty )
                                {
                                    //LOG(1,"Decoding errror code 10:\n" + wholeLine + "!");
                                    throw new RosterException("Decoding errror code 10:\n" + wholeLine);
                                }
                                // Check rest period between sectors to see if we've come to the end
                                // of this duty. > minrest then finish duty so a new one can be started.
                                tmpDate = new Date(startDate.valueOf());
                                tmpDate.setHHMMTime(b[2]);
                                restPeriod = tmpDate.valueOf() - myDuty.endTime.valueOf();
                                if ( restPeriod > MINREST)
                                { // finish old duty
                                    finishOldDuty(); // sets myDuty to 0
                                }
                            }  // /No Report, Already in a duty
                            if ( myDuty == 0 )
                            { // No report, not in a duty
                                LOG(5,"Starting new NO REPORT duty");
                                startNewDuty();
                            } // No report, not in a duty
                            else
                            { // This sector is part of duty on previous line (night sector)
                                if (myDuty.tripNo != a[1])
                                {
                                    throw new RosterException("Trip no's changed mid duty on line:\n" + wholeLine );
                                }
                                myDuty.endTime = new Date(endDate.valueOf());
                            }
                        } // not a report sector
                        else
                        { // sector contains a report time
                            reportDefined = true;
//                            dump("Report\n");
                            if (myDuty != 0) // Wrap up flt duty by adding a clear line
                            {
                                finishOldDuty();
                            }
                            startNewDuty();
                        } // sector contains a report time
//                        dump("Sector:" + sectorSection + "_\n");
                        // Now that weve got the duty object prepared
                        // build the flight sector object
                        processFlightSector();
                    }  // matchFlightSector rexexp
                    else
                    {
//                        dump("No match\n");
//                        chopPoint += 1;
                        throw new RosterException("Parse error on line:" + wholeLine);
                    }
                } while ( !lastSectorOfLineFlag);
            } // matchTripLine regExp
            else
            { // Non flying duty line
                if (myDuty != 0)
                {
                    finishOldDuty();
                }
                myDuty = new groundDuty(trimString(dutyPart), wholeLine, that.created);
                myDuty.startTime = new Date(startDate.valueOf());
                myDuty.endTime = new Date(endDate.valueOf());
                parseFCNonFlyingLine(myDuty);
                myDuty.summary = modLine(myDuty.summary);
                foundMatch=true;
//                dump("\mmmmmmmmmmmmmmmmmmmmmmm\nStart:" + myDuty.startTime + "\n  End:" + myDuty.endTime + "\nSummary:" + myDuty.summary + "_\nDescription:" + myDuty.description +"_\nmmmmmmmmmmmmmmmmmm\n");
                that.duties.push(myDuty);
                mergeDuties(that);
                myDuty = 0;
            } // Non flying duty line
        } // ProcessLine
// ----------- /ProcessLine

        for ( var x in dutyLines)
        { //for
            dutyLine = dutyLines[x];
                dump("\xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n" + dutyLine + "\n");
        
            //// Skip DAY DUTY LINE
            //if ( dutyLine.search(/^ *DAY +DUTY +F[LIGHTSEQUENCE ]+$/) != -1) {
            //  continue;
            //}

            matchIndex = dutyLine.search(/( \d|\d\d) (MO|TU|WE|TH|FR|SA|SU)/);
            if ( matchIndex != -1 ) {
              dutyLine = dutyLine.substring( matchIndex );
            }
            else {
              matchIndex = dutyLine.search(/([ \d|]\d)-([ \d|]\d)/);
              if ( matchIndex != -1 ) {
                dutyLine = dutyLine.substring( matchIndex );
              }
              //else {
              //  throw new RosterException("Unrecognized duty line format:" + dutyLine);
              //}
            }  
            datePart = dutyLine.substring(0,6);
            dutyPart = dutyLine.substring(6);
            startDate = endDate = 0;
//            dump("datePart:" + datePart + "|\n");
//            dump("dutyPart:" + dutyPart + "|\n");
            // ---- Single days ---------------
            if ((a = matchDate.exec(datePart)) != null)
            {
//                dump("Match Single days\n");
                startDay = a[1]-0;
                /* If the previous day has not yet been set to a valid date (prevDay == 0)
                  then make it equal to the current day so we don't get any unwanted rolling
                  over of the date into the next month.*/
                
                prevDay = (prevDay == 0) ? startDay : prevDay;

                setMonth(rolloverDate, startDay, prevDay);
                prevDay = endDay = startDay;
            
                startDate = new Date(rolloverDate.valueOf());
                startDate.setUTCDate(startDay);
                endDate = new Date(startDate.valueOf());
                checkDayMatch(a[2], startDate.getDay(), dutyLine);
            }
            // ---- Multi days ---------------
            if ((a = matchDateRange.exec(datePart)) != null)
            {
//                dump("Match Multi days\n");
                var startDay = a[1]-0; // (-0 forces a conversion to int)

/* Bugfix 06/09/08 to fix problem where rollover into next month starts with a 1- x date range */
                prevDay = (prevDay == 0) ? startDay : prevDay;
                setMonth(rolloverDate, startDay, prevDay);
// end Bugfix
                startDate = new Date(rolloverDate.valueOf());
                startDate.setUTCDate(startDay);

                var endDay = a[2]-0;
                if (endDay < startDay)
                {
                    rolloverDate.incUTCMonth();
                }
                endDate = new Date(rolloverDate.valueOf());
                endDate.setUTCDate(endDay);
                prevDay = endDay;
            }
            if( startDate != 0) // Got a valid date
            {
                processLine(this,dutyPart,dutyLine,startDate,endDate);
                // Tick off the list of days covered by this duty line
                if (endDay < startDay)
                {
                    endDay = endDay + daysInMonth2(startDate);
                }
                for ( var thisDay = startDay; thisDay <= endDay; thisDay++)
                {
                    checkOffDays[thisDay] = true;
                }
            }
            dump ("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n");
        } //for

        // Close any open flying duties
        processLine(this,'','');

    //  dump("\n\nDays in month: " + daysInMonth(this.month,this.year)+"\n");
    //  dump(checkOffDays.length + "\n12345678901234567890123456789012345\n");
        var processedAllDays = true;
        var missingDays = "";
        for (var x = 1; x <= lastDayOfMonth; x++)
        {
            // First, check off trump days
            if ( this.infoLines[x-1].summary == 'FDO')
            {
                checkOffDays[x] = true;
            }
            if (checkOffDays[x] != true)
            {
                missingDays = missingDays + "," + x;
                processedAllDays = false;
            }
    //        dump(checkOffDays[x] == true ? "1" : "0")
        }
        missingDays = missingDays.slice(1); // remove the 1st ',';
    //     dump("\nMissing days: " + missingDays + "\n");

        var dutyHours = this.getDutyHours(this.publishedDutyHours);
        var foundAllDuties = ( dutyHours  == null );
/*        if (isAchievedRoster)
        {
            // Because we can't determine whether the 1st sector should or should not
            // have its duty counted we have to forget about checking against published duty hours.
            var parseMsg = "Processed " + dutyHrs + ":" + dutyMins + " achieved duty hours.";
            foundAllDuties = true; 
        }
        else 
        { */
            if ( foundAllDuties )
            {
                var parseMsg = "OK, processed all " + this.publishedDutyHours.toHHMMString() + " duty hours.\nBefore using please verify against your roster.";
            }
            else
            {
                var parseMsg = "Processed " + dutyHours.toHHMMString() + " duty hours.\n(Published duty is " + this.publishedDutyHours.toHHMMString() + ").\nPlease check your roster.";
            }
   //     }
        if ( !processedAllDays)
        {
    //        parseMsg = parseMsg + "\n No information was found for days " + missingDays + ".";
            parseMsg = "Error, no information was found for days " + missingDays + ".";
        }
        if( !foundAllDuties || !processedAllDays ) {
              throw new RosterException(parseMsg);
        }
        else {
              alert( parseMsg );
        }
    
        // dump("\nDuty Hrs:" + dutyHrs + ":" + dutyMins + "\n" + a[1] + ":" + a[2] + "\n" + "Found All Duties:" +foundAllDuties + "\n" +
      //       "Processed All days:" + processedAllDays + "\n");
        return( foundAllDuties && processedAllDays );
    }
//  ------/parsePage-------------------------------------------------

//  ------checkIfDateInNextMonth-------------------------------------------------
    function checkIfDateInNextMonth(rolloverDate,day,dayOfWeekAlpha)
    {
        var prevDay = rolloverDate.getUTCDate() - 0;
        rolloverDate.setUTCDate(day);
        if ( (day-0) < prevDay )
        {
            try
            {
                checkDayMatch(dayOfWeekAlpha, rolloverDate.getDay(),'');
            }
            catch(err)
            {
                rolloverDate.incUTCMonth();
            }
        }
    }
    //  ------/checkIfDateInNextMonth-------------------------------------------------
    //  ------setMonth-------------------------------------------------
    function setMonth(rolloverDate, dayOfMonth, prevDay)
    {
        /* The problem of determining which month the current day is in will be resolved as follows:
                If there is a difference of more than 15 days between the previous day & the current day
                (prevDay - dayOfMonth) > 15 then increment the month.
                (e.g. 27th - 2nd > 15, so assume the 2nd refers to the next month). 
                If there is a difference of more than 15 days between the current day & the previous day
                (dayOfMonth - prevDay) > 15 then decrement the month.
                (e.g. 27th - 2nd > 15, so assume the 27th refers to the previous month).
                Going back a month is usually due to duties being assigned on wrap days at the end of the month.
                      
                    29 SA      WR   BEGIN 0001 END 2400
                    30 SU      WR   BEGIN 0001 END 2400
                    30 SU 8205   2227 LGW 1005 1120 ATL 2035        
                    31 MO   REST
                     1 TU 8205   2226 ATL 2135 2235 LGW 0640        
                     2 WE   REST
                    31 MO      WR   BEGIN 0001 END 2400
                     2 WE   REST
    
        */
        var diff = prevDay - dayOfMonth;
        if (diff >= 15) {rolloverDate.incUTCMonth();}
        if (diff < -15) {rolloverDate.decUTCMonth();}
    }
    //  ------/setMonth-------------------------------------------------
    
    //  ------checkDayMatch-------------------------------------------------
    function checkDayMatch(dayOfWeekAlpha,dayOfWeekNo,text)
    {
        if( dayOfWeekAlpha != DAYSOFWEEK[dayOfWeekNo])
        {
            throw new RosterException("Weekday does not match date in :" + text);
        }
    }
    //  ------/checkDayMatch-------------------------------------------------
    
    //  ------getCrewNames-------------------------------------------------
    function getCrewNames(that)
    {
        var crewLine, myFlightCrew, matchNames = /^ *(\d{4})\/(\d{2}) +([A-Z \-\.\(\)]+)$/img;
        var rolloverDate = new Date(that.baseDate.valueOf()),prevDate = 0,tripDate;
        while ((crewLine = matchNames.exec(that.text.footer)) != null)
        {
    //        dump(crewLine[1] + "\n" + crewLine[2] + "\n" + crewLine[3] + "\nnnnnnnnnnnnnnnn\n");
            tripDate = crewLine[2];
            prevDate = tripDate;
            checkIfDateInNextMonth(rolloverDate,tripDate,null);
            myFlightCrew = new flightCrew();
            myFlightCrew.date = new Date(rolloverDate.valueOf());
            myFlightCrew.tripNo = crewLine[1];
            myFlightCrew.names = crewLine[3];
            that.crewList[daysSince1970(rolloverDate)] = myFlightCrew;
        }
    }
    //  ------/getCrewNames-------------------------------------------------
    
    
    //  ------mergeDuties-------------------------------------------------
    function mergeDuties(that)
    /* This function will for example merge individual WR day lines into one WR event covering multiple days*/
    {
        if( that.duties.length > 1)
        {
            var thisDuty = that.duties.pop();
            var prevDuty = that.duties.pop();
            if ( prevDuty.summary == thisDuty.summary && prevDuty.wholeDay && thisDuty.wholeDay )
            {
                prevDuty.endTime = new Date(thisDuty.endTime.valueOf());
                that.duties.push(prevDuty);
            }
            else
            {
                that.duties.push(prevDuty);
                that.duties.push(thisDuty);
            }
        }
    }
    //  ------/mergeDuties-------------------------------------------------
    
    //  ------parseFCNonFlyingLine-------------------------------------------------
    function parseFCNonFlyingLine(theDuty)
    {
//        dump ("Parse FC:" + theDuty.summary + "|\n");
        var matchOffDays = /^(OFF|REST)\s*$/; // OFF or REST
        var matchCodeLines = /^([A-Z0-9]{2,})\s+BEGIN\s+(\d{4})\s+END\s+(\d{4})\s*$/; // cc BEGIN hhmm END hhmm
    //    var matchCodeLines = /^([A-Z0-9]+)\s+BEGIN\s+(\d{4})\s+END\s+(\d{4})\s*$/; // cc BEGIN hhmm END hhmm
        var a;
        if ((a = matchOffDays.exec(theDuty.summary)) != null)
        {
            theDuty.dutyCode = theDuty.summary = a[1];
            theDuty.startTime.setHHMMTime("0000");
            theDuty.endTime = new Date(theDuty.endTime.valueOf() + WHOLEDAY);
            theDuty.wholeDay = true;
    //            dump("OFF - BEGIN:" + theDuty.startTime + "\n");
    //            dump("OFF - END:" + theDuty.endTime + "\n");
        }
        else
        {
            if ((a = matchCodeLines.exec(theDuty.summary)) != null)
            {
                theDuty.dutyCode = a[1];
                theDuty.summary = a[1] + " BEGIN " + a[2] + " END " + a[3];
                a[2] = ((a[2] == '0001') ? '0000' : a[2]);
                theDuty.startTime.setHHMMTime(a[2]);
                if (a[3] == '2400') // A whole day
                {
                    theDuty.endTime = new Date(theDuty.endTime.valueOf() + WHOLEDAY);
                    theDuty.wholeDay = true;
                }
                else
                {
                    theDuty.endTime.setHHMMTime(a[3]);
                    if( theDuty.endTime < theDuty.startTime ) // endTime has run over into next day
                    {
                        theDuty.endTime.setUTCDate(theDuty.endTime.getUTCDate() + 1);
                    }
                }
    
    //            dump("BEGIN:" + theDuty.startTime + "\n");
    //            dump("END:" + theDuty.endTime + "\n");
            }
        }
    //    dump("Code:" + theDuty.dutyCode + "\n");
        return (theDuty.wholeDay);
    }
    //  ------/parseFCNonFlyingLine-------------------------------------------------
}
BaFcRoster.prototype = new roster();
