/**************************************************************
This code is copyright of Jon Lidgard (jonlidgard@gmail.com).
Please do not copy, modify, or distribute without prior consent.

Version 0.1.25, April 20th, 2008.
***************************************************************/



debugger;

function baCcGroundDuty(summary, description, creationDate)
{
       baseEvent.call(this);
       this.dutyCode = "";
       this.isWholeDay = function()
       {
              return( (this.endTime.valueOf() - this.startTime.valueOf() + ONEMINUTE) % WHOLEDAY == 0)
       }
       this.created = new Date(creationDate.valueOf());
       this.lastModified = new Date(creationDate.valueOf());
       this.summary = trimString(summary);
       this.description = trimString(description);
       this.showEvent = function()
       {
              var optionOffDays = rosterprocessor_getBooleanPreference("rosterprocessor.ccShowOffDays", true);
              var optionLeaveDays = rosterprocessor_getBooleanPreference("rosterprocessor.ccShowLeaveDays", true);
              var dontShowIt =                     
                   (!optionOffDays && this.summary in set('OFF','PT-NW')) ||
                   (!optionLeaveDays && this.summary in set('LEAVE'));

              return !dontShowIt;
       }
}

baCcGroundDuty.prototype = new baseEvent();

function BaCcFlyingDuty(summary, description, creationDate)
{
       baseEvent.call(this);
       this.tripNo = "0000";
       this.sectors = [];
       this.crewList = "";
       this.categories = "TRIP";
       this.created = new Date(creationDate.valueOf());
       this.lastModified = new Date(creationDate.valueOf());
       this.summary = trimString(summary);
       this.description = description;
       function abbrevBase(base) // Abbreviated the home base to L or G
       {
              base = (base == 'LGW') ? 'G' : base;
              base = (base == 'LHR') ? 'L' : base;
              return base;
       }
       this.getSummary = function()
       {
              if ( rosterprocessor_getBooleanPreference("rosterprocessor.ccNoSummary", false) )
                     return this.description;

              var summaryLine,orig,dest,lastDest = '';
              var tmpSector = this.sectors[0];
              var separator; // normally '-' but  '*' for a positioning sector
//              summaryLine = "R" + this.startTime.toISO8601String(7,true) + "L ";
              summaryLine = this.summary + ' ';
//               abbrevBase(tmpSector.origin.IATA);
// Mod Ver 0.1.25 07/09/08 - Removes BA_ from flight no on summary line
              if ( rosterprocessor_getBooleanPreference("rosterprocessor.ccShowFltNo", true))
              {
                     var fn = trimString(tmpSector.flightNo.replace(/BA/,""));
                     
                     summaryLine = summaryLine + fn + " ";
              }

              for( var s in this.sectors )
              {
                 tmpSector = this.sectors[s];
                 separator = (tmpSector.preFltCode == '*') ? '*' : '-';
                 if( tmpSector.origin.IATA != lastDest)
                 {
                     summaryLine = summaryLine + ((lastDest == '') ? '' : separator);
                     summaryLine = summaryLine + abbrevBase(tmpSector.origin.IATA);
                 }
                 lastDest = tmpSector.dest.IATA;
                 summaryLine = summaryLine + separator + abbrevBase(lastDest);
              }
              summaryLine = summaryLine + " C" + this.endTime.toISO8601String(7,true) + "L";
              return summaryLine;
       }
       this.showSectors = function()
       {
       // Function added in 0.1.25 - NEED TO TEST
              return ( rosterprocessor_getBooleanPreference("rosterprocessor.ccSplitTrip", true) );
       }
};
BaCcFlyingDuty.prototype = new baseEvent();

function BaCcFlightSector( creationDate )
{
       baseEvent.call(this);
       this.created = new Date(creationDate.valueOf());
       this.lastModified = new Date(creationDate.valueOf());
       this.preFltCode = ""; // code, e.g. DH applied before flight no'
       this.postFltCodes = ""; // codes, e.g. CK,CP, applied after sector details
       this.flightNo = "";
       this.origin = {IATA:"",ICAO:"",NAME:""};
       this.dest = {IATA:"",ICAO:"",NAME:""};
       this.crewList = "";
       this.capacity = "P1";
       this.getSummary = function()
       {
              if ( rosterprocessor_getBooleanPreference("rosterprocessor.ccNoSummary", false) )
                     return this.description;

              var summaryLine = '';
              if ( rosterprocessor_getBooleanPreference("rosterprocessor.ccShowFltNo", true) && this.flightNo != '')
              {
                     summaryLine = trimString(this.flightNo.replace(/BA/,"")) + " ";
              }
              
              var separator = (this.preFltCode == '*') ? '*' : '-';

              summaryLine = summaryLine + abbrevBase(this.origin.IATA);
              summaryLine = summaryLine + this.startTime.toISO8601String(7);
              summaryLine = summaryLine + separator + abbrevBase(this.dest.IATA);
              summaryLine = summaryLine + this.endTime.toISO8601String(7);

              summaryLine = trimString(summaryLine);
              LOG(10,"Summary Line " + summaryLine);
              return summaryLine;
       }
}

BaCcFlightSector.prototype = new baseEvent();




function BaCcRoster()
{
    roster.call(this);

// ---- PUBLIC FUNCTIONS ---------------------------------------------------------    
    // Returns a string to use as subject line for use when mailing roster
    this.getTitleString = function()
    {
//       return("TITLE STRING TEST");
       return( this.firstName + ' ' + this.lastName + 
        '\'s roster for ' + MONTHSOFYEAR[this.baseDate.getUTCMonth()] + ' ' + this.baseDate.getUTCFullYear());
    }

//  ---------------------------------------------------------
    // Returns a string to use as a filename when saving roster
       this.getFileName = function()
       {
           var monthNo = this.baseDate.getMonth() + 1;
           monthNo = (monthNo < 10) ? "0" + monthNo : monthNo;
           var shortYear = this.baseDate.getFullYear() - 2000;
           shortYear = (shortYear < 10) ? "0" + shortYear : shortYear;
//        dump("Month No: " + monthNo + "," + myRoster.nameCode + "," + shortYear + "\n");

           var crewCode = (this.lastName.substr(0,3) + this.lastName.substr(-1) + this.firstName.substr(0,1)).toUpperCase();   
           return( crewCode + monthNo + shortYear );
       }
//  ---------------------------------------------------------

       function modLine(line)
       {
       line = line.replace(/^\s+|\s+$/g,"");
       line = line.replace(/\s+/g," ");
       line = line.replace(/AVIATION\sMEDICINE/,"AVMED");
       line = line.replace(/ LOCAL\sTIME\s(LGW|LHR)/,"L");
       line = line.replace(/STANDBY AT HOME/,"HSB");
       line = line.replace(/STANDBY/,"STBY");
       line = line.replace(/OFF DUTY/,"OFF");
       line = line.replace(/ANNUAL LEAVE/,"LEAVE");
       line = line.replace(/900 HRS GROUND WORK/,"900H GW");
       line = line.replace(/PT-TIME NON WORKING/,"PT-NW");
       line = line.replace(/JOBSHARE NONWORKING/,"JS-NW");
       line = line.replace(/MAN HAND ONLINE/,"MAN HND");
       line = line.replace(/AVAILABLE/,"AVAIL");
       line = line.replace(/DAY IN LIEU/,"LIEU DAY");
/*       line = line.replace(/\sLGW/,"-G");
       line = line.replace(/LGW\s/,"G-");
       line = line.replace(/\s+LGW\s+/,"-G-");
       line = line.replace(/\sLHR/,"-L");
       line = line.replace(/LHR\s/,"L-");
       line = line.replace(/\s+LHR\s+/,"-L-");
*/       return( line );
       }
//  ---------------------------------------------------------

       function preProcessBACabinCrewRoster(that)
       {
           // Get the entire roster into rosterText
           var a = null, leftTrim = /^[\s\n]*\w/ig, rightTrim = /[\s\n]*$/;
           var removeHTML = /<.*?>/g;
           var nameString;
           that.text.all = "NOT FOUND!";
           //Get name   
           var bodyHTML = rp_getContentDocument().body.innerHTML;

           a = /Roster\sfor\s?(.*?)\n+/mi(bodyHTML);
           if ( !a )
           {
              throw new RosterException("Unrecognised roster format");
           }

           bodyHTML = bodyHTML.replace(removeHTML,'');
           bodyHTML = bodyHTML.replace(/(\s\s)+$/g,"");
//           bodyHTML = bodyHTML.replace(/(\n\n)+$/g,"");
           bodyHTML = bodyHTML.replace(/^\s+(?=[A-W]{2}\s\d{2}\s[A-Y]{3})/mg,"");

           dump(bodyHTML);
           dump("\n---------------------------------------------------\n");
           a = /Roster\sfor\s?(.*?)\n+/mi(bodyHTML);
           if ( a )
           {
               nameString = a[1];
               that.text.all = RegExp.rightContext;
              // Remove ========== line added during roster save as text
              that.text.all = that.text.all.replace(/^\s*======+\s*$/m,'');
              that.removeHeaderInfo();
               dump("a[1] "+a[1]+"_\n");
               dump("RC\n"+that.text.all+"______________\n");
               
              b = /([A-Za-z\-]+)\s?([A-Za-z\-]+)/i(a[1]);
               that.firstName = b ? b[1] : '';
               that.lastName = b ? b[2] : '';
               that.text.header = "Roster for " + nameString + "\n\n";
           }

           else
           {
              throw new RosterException("Unrecognised roster format");
           }

           a = /^\s*(MESSAGES.*?)$/im(that.text.all);
           if ( a )
           {
              that.text.body = RegExp.leftContext;
              that.text.footer = a[1] + RegExp.rightContext;
              that.addFooterInfo();
           }
           else
           {
               throw new RosterException("Couldn't find MESSAGES line");
           }

           if (true)
           {
              dump("\nNamestring:" + nameString +
                   "\nFirst name:" + that.firstName +
                   "\nLast name:" + that.lastName +
                   "\n---------HEADER------------------------\n" +
                   that.text.header + "\n--------BODY-------------------------\n" + 
                   that.text.body + "\n----------FOOTER-----------------------\n" + 
                   that.text.footer + "\n--------END-------------------------\n"
               );
           }
           return true;
       }
//  ---------------------------------------------------------
       this.getRosterInfo = function()
       {
              try
              {
                     preProcessBACabinCrewRoster(this);
                     a = /COMPLETE\sROSTER\sPUBLISHED\s+([0-3][0-9])([0-1][0-9])([0-3][0-9])\s+/(this.text.footer);
                     this.month = a[2]-1;
                     this.year = a[3];
       //        this.baseDate = new Date(a[1] + " 1, " + a[2] + " 00:00:00 UTC");
//                     dump(this.baseDate + "\n");
                     this.created.setFullYear(2000+(a[3]-0),a[2]-1,a[1]);
                     this.baseDate = new Date(this.created.valueOf());
                     a = /Your planned block hours to the end of ([A-Za-z]{3}) are/(this.text.footer);
                     tmpDate = new Date(this.baseDate.valueOf());
                     var rosterMonth = indexOfMonth(a[1]); 
                     if ( rosterMonth > tmpDate.getMonth() ) {
                            // If here then the roster month is in the year previous to the COMPLETE_ROSTER_PUBLISHED line one
                            this.baseDate.setUTCFullYear(tmpDate.getUTCFullYear()-1);
                     }
                     this.baseDate.setUTCMonth(rosterMonth);
               }       
              catch(err)
              {
                     if( DEBUG )
                     {
                            dump(err + " in getBACabinCrewRosterInfo!\n");
                     }
                     throw new RosterException("Invalid BA Cabin Crew Roster");
              }
       }
//  ---------------------------------------------------------

       this.parsePage = function()
       {
           var dutyLines = this.text.body.split('\n');
           var matchLine = /^\s*([A-Z]{2})\s+(\d\d?)\s+([A-Z]{3})\s+(.*)\s*$/;
           var matchSector = /^\s*(\d{4})\s+(\*\s?)?((?:BA|STL|SBY|STW)\s?\d{3,4})\s+([A-Z]{3})\s+([A-Z]{3})\s+(\d{4})\s+([A-Z0-9]{3})(\s+(\d{2,4}))?/;
           var matchReport = /REPORT\sAT\s+(\d{4})\s+LOCAL\sTIME\s+([A-Z]{3})\s*$/;
           var matchClear = /^\s*CLEAR\s+TIME\s+(\([A-W]{2}\s\d{2}\s[A-Y]{3}\)\s+)?(\d{4})\s+LOCAL\sTIME\s+([A-Z]{3})\s*$/;
           var matchTotalDuty = /TOTAL\s+DUTY\s+HOURS\s+(\d{2,4})/;
           var matchGndDay = /^\s*(.*)\s+(\d{4})\s+(\d{4})\s+LOCAL\sTIME\s+([A-Z]{3})\s*$/;
           var matchMultiDay = /^\s*(.*)\s+THRU\s+(\d{2})\s+([A-Z]{3})\s+(\d{2})\s*$/;
           var matchDate = /([A-W]{2})\s(\d{2})\s([A-Y]{3})/;
           var matchFsSs = /FS\/SS\s*$/; // Indicates working down as main crew
           var a, b, myDuty, myFlightSector, myCrew, dutyLine, dutyCount = new Date(0),rolledOverFlag = false, isLocalStartTime;
           var lastDayOfMonth;
           var rolloverDate = new Date(this.baseDate.valueOf());
           var dutyDate, tmpYear, dutyRig;
           var decodeState = 0;
           var dateLine = false; // set when line starts out with dd ddd mm line
           var dutyPeriod = 0;
          /* decodeState - 0 - expecting a dd ddd mmm line
                            1 - start of a trip, before 1st sector
                            2 - mid trip
                            3 - Found CLEAR TIME line
           */
              function processLine(that,line)
              {
              try { // try
                   var a, foundMatch=false;
              // Is it a multi day entry, e.g. ANNUAL LEAVE THRU 27 feb 08 ?
                   if ((a = matchMultiDay.exec(line)) != null)
                   {
//                     dump("HERE match multi\n");
                     if ( decodeState != 0)
                     { // We've got a Ground LINE but we're already in a trip so a decode error
                            throw new RosterException("in line " + (x-0+1) + " : " + line);
                     }
                     foundMatch=true;
//                     dump("---->" + decodeState + "\n---->" + a[1] + "\n---->" + a[2] + "\n---->" + a[3] + "\n---->" + a[4] + "\n------------------------\n");
                     myDuty = new baCcGroundDuty(modLine(a[1]), trimString(a[1]), that.created);
                     myDuty.startTime = new Date(dutyDate.valueOf());
                     myDuty.startTime.setHHMMTime("0000");
                     myDuty.endTime = new Date(a[3] + " " + a[2] + ", 20" + a[4] + " 00:00:00 UTC");
                     myDuty.endTime = new Date(myDuty.endTime.valueOf() + WHOLEDAY);
                     myDuty.wholeDay = true;

                     that.duties.push(myDuty);
                     mergeDuties(that);

//                     dump("\ngggggggggggggg\n" + myDuty.startTime + " - " + myDuty.endTime + " : " + myDuty.summary + "\ngggggggggggggg\n");       
                   }
              // Is it a ground duty i.e. hhmm hhmm LOCAL TIME xxx?
                   if ((a = matchGndDay.exec(line)) != null)
                   {
//                     dump("HERE match ground\n");
                     if ( decodeState != 0 && decodeState != 4)
                     { // We've got a Ground LINE but we're already in a trip so a decode error
                            throw new RosterException("in line " + (x-0+1) + " : " + line);
                     }
                     foundMatch=true;
//                     dump("---->" + decodeState + "\n---->" + a[1] + "\n---->" + a[2] + "\n---->" + a[3] + "\n---->" + a[4] + "\n------------------------\n");
                     myDuty = new baCcGroundDuty(modLine(line), trimString(a[1]), that.created);
                     myDuty.startTime = new Date(dutyDate.valueOf());
                     myDuty.startTime.setHHMMTime(a[2],true);
                     myDuty.endTime = new Date(myDuty.startTime.valueOf());
                     myDuty.endTime.setHHMMTime(a[3],true);
                     if( myDuty.endTime < myDuty.startTime ) // endTime has run over into next day
                     {
                         myDuty.endTime.setUTCDate(myDuty.endTime.getUTCDate() + 1);
                     }

                     that.duties.push(myDuty);
                     mergeDuties(that);
//                     dump("\ngggggggggggggg\n" + myDuty.startTime + " - " + myDuty.endTime + " : " + myDuty.summary + "\ngggggggggggggg\n");       
                   }

              // Is it a flying duty ?
                   if ((a = matchReport.exec(line)) != null)
                   {
//                     dump("HERE match report\n");
                     if ( decodeState != 0 && decodeState != 4)
                     /* decodeState 4 would occur where there are 2 duties on same day, e.g.
                       2nd of 2 night duties
                     */
                     { // We've got a REPORT LINE but we're already in a trip so a decode error
                            throw new RosterException("in line " + (x-0+1) + " : " + line);
                     }
                     foundMatch=true;
                     decodeState = 1; // Started a trip
//                     dump("---->" + decodeState + "\n---->" + a[1] + "\n---->" + a[2] + "\n------------------------\n");
                     myDuty = new BaCcFlyingDuty('R'+a[1]+'L ', (trimString(line)+"\\n"), that.created);
                     myDuty.startTime = new Date(dutyDate.valueOf());
                     myDuty.startTime.setHHMMTime(a[1], true);
                     dutyRig = 0; // Reset the trip duty totalizer
//                     dump("\ssssssssssssssssssss\n" + myDuty.startTime + " - " + myDuty.endTime + " : " + myDuty.summary + " : " + myDuty.description + "\nsssssssssssssssssss\n");       
                   }
// Are we working down for this trip
                   if (((a = matchFsSs.exec(line)) != null) && (decodeState == 1) )
                   {
//                     dump("HERE match FS/SS\n");
                     foundMatch=true;
//                     myDuty = that.duties.pop();
                     myDuty.summary = '!' + myDuty.summary;
                     myDuty.description = myDuty.description + trimString(line) + "\\n";
//                     that.duties.push(myDuty);
//                     dump("myDuty.summary: " + myDuty.summary + "\n");
                   } 

              // is it a sector
                   if ((a = matchSector.exec(line)) != null)
                   {
//                     dump("HERE match sector\n");
                     if ( decodeState != 1 && decodeState != 2)
                     { // We've got a SECTOR LINE but we're not in a trip so a decode error
                     throw new RosterException("in line " + (x-0+1) + " : " + line);
                     }
                     foundMatch=true;
//                     dump("---->" + decodeState + "\n---->" + a[1] + "\n------------------------\n");
//                     dump("---->" + decodeState + "\na[1]---->" + a[1] + "\na[2]---->" + a[2] + "\na[3]--->" + a[3] + "\na[4]---->" + a[4] + "\na[5]---->" + a[5] + "\na[6]---->" + a[6] + "\na[7]---->" + a[7] + "\na[8]---->" + a[8] +"\n------------------------\n");

                     myFlightSector = new BaCcFlightSector(that.created);
                     with (myFlightSector)
                     {
/*                        if ( a[2] )
                        {
                            preFltCode = '*'; //trimString(a[2]);
                        }
*/
                        preFltCode = (a[2]) ? '*' : '';
                        flightNo = a[3];
                        origin.IATA = a[4];
                        dest.IATA = a[5];
                        summary = modLine(line);
                        description = modLine(line);
                        startTime = new Date(dutyDate.valueOf());
                        startTime.setHHMMTime(a[1]);
                        endTime = new Date(dutyDate.valueOf());
                        endTime.setHHMMTime(a[6]);
                        if( endTime < startTime ) // endTime has run over into next day
                        {
                            endTime.setUTCDate(endTime.getUTCDate() + 1);
                        }
                        postFltCodes = a[7]; // aircraft type
/*                        if ( origin.IATA == 'LHR' || dest.IATA == 'LHR')
                        {
                               var reportTime = startTime.valueOf() - LHRCCPREFLIGHTDUTYTIME;
                        }
                        else
                        {
*/                               var reportTime = startTime.valueOf() - PREFLIGHTDUTYTIME;
//                        }
                        if ( !myDuty )
                        {
                            if ( decodeState == 2 )
                            {
                                   myDuty = that.duties.pop();
                                   that.duties.push(myDuty);
                                   var parsedDuty = myDuty.endTime.valueOf() - myDuty.startTime.valueOf();
                                   dump("parsedDuty:" + parsedDuty + ", " + new Date(parsedDuty) + "\n");
                                   /*duty Period is extracted from the end of the sector line
                                    during the previous iteration of this function
                                   */
                                   if ( dutyPeriod.valueOf() != parsedDuty )
                                   {
                                          dump("Parsed duty " + parsedDuty + "\nDutyPeriod " + dutyPeriod.valueOf() +"\n");
                                          dump("Duty periods don't match " + dutyPeriod + "\n" + line);
//                                          alert("Duty hours mismatch\n" + line);
                                   }
                            }
//                            dump("New Duty\n");
                            myDuty = new BaCcFlyingDuty('','', that.created);
                            myDuty.startTime = new Date(reportTime);
                        }
                        myDuty.description = myDuty.description + trimString(line) + "\\n";
                        myDuty.sectors.push(myFlightSector);                        
                        if ( a[8] ) // duty hours, therefore end of a duty
                        {
                            dutyPeriod = new Date(0);
                            dutyPeriod.setHHMMTime(trimString(a[8]));
//                            dump("DutyPeriod:" + a[8] + ", " + dutyPeriod + "\n");
                            myDuty.endTime = new Date(endTime.valueOf() + POSTFLIGHTDUTYTIME);
//                            dump("Old myDuty.startTime:" + myDuty.startTime + "\nOld myDuty.endTime:" + myDuty.endTime + "\n");
                            dutyRig = dutyRig + parsedDuty;
                            that.duties.push(myDuty);
                            myDuty = null;
                        }
                        else
                        {
                            dutyPeriod = 0;
                        }
                     }
//                     dump(a[1] + "\n" + a[2] + "\n" + a[3] + "\n" + a[4] + "\n" + a[5] + "\n" + a[6] + "\n" + a[7] + "\n" + a[8] + "\n------------------------\n");
                     decodeState = 2;
                   }
                   if ((a = matchClear.exec(line)) != null)
                   {
//                     dump("HERE match clear\n");
                     if ( decodeState != 2)
                     { // We've got a CLEAR LINE but we're not in a trip so a decode error
                            throw new RosterException("Clear line but not in a trip " + (x-0+1) + " : " + line);
                     }
                     foundMatch=true;
                     myDuty = that.duties.pop();
//                     dump("myDuty.description: " + myDuty.description);
                     myDuty.description = myDuty.description + trimString(line);
                     if ( a[1] && ( ( b = matchDate.exec(a[1]) ) != null)) // CLEAR TIME (dd dd mmm)-a[1]
                     {
                            dutyDate = new Date(b[3] + " " + b[2] + ", " + dutyDate.getUTCFullYear() + " 00:00:00 UTC");
                            if (dutyDate < myDuty.startTime)
                            {
                                   dutyDate.setFullYear(dutyDate.getFullYear()-0+1);
                            }
                     }
                    dutyDate.setHHMMTime(a[2], true);
                    dump("Clear Time " + dutyDate + "\nEnd Time " + myDuty.endTime + "\n");
                    var clearTimeAdjust = dutyDate.valueOf() - myDuty.endTime.valueOf();
                    dump("\n"+ line + "\nClearTime Adj " + new Date(clearTimeAdjust)+"\n");
                    dutyRig = dutyRig + clearTimeAdjust;
                    myDuty.endTime = new Date(dutyDate.valueOf()); 
                     /*                    if ( myDuty.endTime.valueOf() != dutyDate.valueOf() )
                     { // Another sanity check on duties lengths matching up
                            alert("Clear times don't match: myDuty.endTime:" + myDuty.endTime +" , dutyDate:" + dutyDate +"\n");
//                            dump("Clear times don't match: myDuty.endTime:" + myDuty.endTime +" , dutyDate:" + dutyDate +"\n");
                            throw("eInvalidBACabinCrewRoster in line " + (x-0+1) + " : " + line);
                     }
*/
                     that.duties.push(myDuty);
                     decodeState = 3;
//                     dump("\nssssssssssssssssssss\n" + myDuty.startTime + " - " + myDuty.endTime + " : " + myDuty.summary + "\nsssssssssssssssssss\n");       
                   }
                   if ( decodeState == 4 )
                   {
                     myDuty = that.duties.pop();
                     myDuty.description = myDuty.description + "\\n" + trimString(line);
//                     dump("myDuty.description: " + myDuty.description);
                     that.duties.push(myDuty);
                   }
                   if ((a = matchTotalDuty.exec(line)) != null)
                   {
//                     dump("HERE match total duty\n");
                     if ( decodeState != 3)
                     { // We've got a TOTAL DUTY LINE but we've not had the CLEAR line
                            throw new RosterException("Total duty but not had a Clear line " + (x-0+1) + " : " + line);
                     }
                     foundMatch=true;
//                     dump("TotalDuty:" + trimString(a[1]) + "\n");
                     var totalDuty = new Date(0);
                     totalDuty.setHHMMTime(trimString(a[1]));
                     dump("DutyRig " + dutyRig + "\n"); //", " + new Date(dutyRig) + "\n");
                     dump("totalDuty:" + totalDuty + "\n");
                     if ( totalDuty.valueOf() != dutyRig )
                     {
//                                   dump("Duty periods don't match\n" + line);
//                                   alert("Duty hours don't match\n" + line);
                     }
                     decodeState = 4; // Crew names may follow, or next duty
                   }
//                   if ( (decodeState == 0 || decodeState == 4 ) && !foundMatch )
                   if ( decodeState == 0 && !foundMatch )
                   {
//                     dump("---->" + decodeState + "\n---->" + line + "\n------------------------\n");
                     myDuty = new baCcGroundDuty(modLine(line), trimString(line), that.created);
                     myDuty.startTime = new Date(dutyDate.valueOf());
                     myDuty.startTime.setHHMMTime("0000");
                     myDuty.endTime = new Date(myDuty.startTime.valueOf() + WHOLEDAY);
                     myDuty.wholeDay = true;
                     that.duties.push(myDuty);
                     mergeDuties(that);
                     foundMatch = true;
//                     dump("\ngggggggggggggg\n" + myDuty.startTime + " - " + myDuty.endTime + " : " + myDuty.summary + "\ngggggggggggggg\n");       
                   }
                   if ( !foundMatch ) // If here then an unrecognised line
                   {
//                     dump("Not decoding:" + line + "\n");
//                     alert("Unable to decode line:\n" + line);
                   }
              } // try
              catch(e)
              {
                     throw new RosterException(e);
              }
              }
           for ( var x in dutyLines)
           {
                  dutyLine = dutyLines[x];
//                dump("\xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n" + dutyLine + "\nxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n");

               if ((a = matchLine.exec(dutyLine)) != null)
               {
                   tmpYear = this.baseDate.getFullYear();
                       if( false )
                       {
//                            dump(a[1] + "\n" + a[2] + "\n" + a[3] + "\n" + a[4] + "\n------------------------\n");
                       }
       
       //            dayOfMonth = a[2]-0;
         
                   dutyDate = new Date(a[3] + " " + a[2] +", " + tmpYear + " 00:00:00 UTC");
                   if (dutyDate.getMonth() > (this.baseDate.getMonth() + 3)) // Month from previous year?
                   {
                     dutyDate.setUTCFullYear(tmpYear-1);
                   }
                   if ( decodeState == 4)
                   {
                     decodeState = 0;
                   }
//                     dump("----------\n" + dutyDate + "\n" + a[4] + "\n--------------\n");
                     processLine(this, a[4]);
               
               }
               else
               {
                     if ( trimString(dutyLine) != "" ) // don't process blank lines
                     {
                            processLine(this, dutyLine);
                     }
               }
           }
           return true;
       }
    //  ------mergeDuties-------------------------------------------------
    function mergeDuties(that)
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
   

    //  ------getCrewNames-------------------------------------------------
    function getCrewNames(that)
    {
        var crewLine, myFlightCrew, matchNames = /^\s*(\d{4})\/(\d{2})\s+([A-Z\s\.\(\)]+)$/img;
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
       
}
BaCcRoster.prototype = new roster();


