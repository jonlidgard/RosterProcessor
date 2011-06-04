/* Copyright (c) 2006 YourNameHere
   See the file LICENSE.txt for licensing information. */

/*globals YAHOO */

/*jslint white: false, devel: true */

"use strict";

YAHOO.rp.BaFcSummaryBuilder = function() {
    var nextLineIsDayOfWeekLine = false,
        lte = YAHOO.rp.BaFcLineTypeEnum,
        summaryLines = [],
        summaryDays = [],
        matches = {
            dashedLine : /^-+$/,
            monthDateLine : /^\s*\(01\) 02 {2}03/,
            tripSummaryLine : /\d{4}/
        },
//        DayData = {date: 0, dayOfWeek: 'xx', trip: 'xxxx', dest: 'xxx', carryInTripFlag: false, gndDuties: ''},
        SummaryData = function() {
          this.date = 0;
          this.dayOfWeek = 'xx';
          this.tripNo = '';
          this.dest = 'xxx';
          this.carryInFlag = false;
          this.gndDuties = [];

/*
	33793308                    3379            3283        3317            3393        3319                3280
 lgw     LGW JER LGW                  -  LGW         EDI JER LGW JER LGW         LGW         JER LGW  -          EDI JER LGW
 (01) 02  03  04  05  06  07  08  09  10  11  12  13  14  15  16  17  18  19  20  21  22  23  24  25  26  27  28  29  30  01  02

start trip if day has a trip no'
start a CI trip if day = 01 & no trip no' & duty !=''
end a trip if next day has trip no or duty != 'XXX'

start duty if duty line = 'XXX'
start duty if duty line = '-' & duty != 'REST'
end duty if duty line = 'XXX'

Day 01 - end of carry in trip
    start a carry in trip, start duty, end duty
    02 - end trip
    03 - start of trip & start & end of duty
    04 - end duty
*/

          this.isStartOfTrip = function() {
            var result = false;
            if (+this.tripNo > 999) {
                result = true;
            }
            return true;
          };

          this.isEndOfDuty = function() {
            var result = false;
            if (this.dest.length === 3) {
                result = true;
            }
            return true;
          };

          this.isNotFlyingDuty = function() {
            var result = false;
            if ((this.tripNo === '') && (this.dest === '')) {
                result = true;
            }
            return true;
          };

        },
        newDay,
        carryInTripFlag = false,

        testForDatesLine = function(line, matchedFields) {
            if ((matchedFields = matches.monthDateLine.exec(line)) !== null) {
                console.log("Found a dates line");
                return lte.datesLine;
            }
            return lte.unrecognised;
        },

        processSummaryLines = function() {
            var dateLine, daysLine, tripLine='', dutyEndLine='', offset,
                theDate,theDay,gndDuty,theTrip, theDest,
                lastDayOfMonth,i=0,j,k,sl,
                processedFirstTripFlag = false;

            console.log("Processing Summary");
            daysLine = summaryLines.pop();
            dateLine = summaryLines.pop();

            // find the trip line & duty-end line
            // duty-end is the destination where the duty finishes for the night.
            // If still flying at midnight or on a split duty then = '-'

            while (i < summaryLines.length) {
                tripLine = summaryLines[i];
                if (matches.tripSummaryLine.exec(tripLine) !== null ) {
                    dutyEndLine = summaryLines[i+1];
                    // remove these 2 lines so only days off stuff left in array
                    summaryLines.splice(i,2);
                    break;
                }
                i += 1;
            }

            console.log(dateLine);
            console.log(daysLine);
            console.log(tripLine);
            console.log(dutyEndLine);

            // Find the whitespace offset from the start of the line to the (01) string in the dateLine
            offset = dateLine.search(/ \(01\) 02 {2}03/);
            lastDayOfMonth = 0;
            for( i = offset ; i < dateLine.length; i = i + 4) {
                theDate = +dateLine.substring(i+2,i+4);
                if ( theDate < lastDayOfMonth ) {
                    theDate = theDate + lastDayOfMonth;
                }
                else {
                    lastDayOfMonth = theDate;
                }

                theDay = daysLine.substring(i+2,i+4);
                theTrip = tripLine.substring(i,i+4).trim();
                theDest = dutyEndLine.substring(i,i+4).trim();

                newDay = new SummaryData();
                newDay.date = theDate;
                newDay.dayOfWeek = theDay;
                newDay.dest = theDest;
                newDay.tripNo = theTrip;

                // get all gnd duties for associated day
                for (j = 0; j < summaryLines.length; j += 1) {
                    sl = summaryLines[j];
                    gndDuty = sl.substring(i+2,i+4).trim();
                    if (gndDuty !== '') {
                        k = i;
                        // Find the GD in  a GD-----> line
                        while (((gndDuty === '-') || (gndDuty === '>')) && k > 1) {
                            k -= 2;
                            gndDuty = sl.substring(k+2,k+4).trim();
                        }
                        newDay.gndDuties.push(gndDuty);
                    }
                }

                // Test for carry in trip (no trip no & dest in lowercase)
                if ((theTrip === '' ) &&
                    (theDest === theDest.toLowerCase()) &&
                    (processedFirstTripFlag === false)) {
                    newDay.carryInTripFlag = true;
                    carryInTripFlag = true;
                }

		console.log(theDate + "_" + theDay + "_" + theTrip + "_");
		summaryDays.push(newDay);
		processedFirstTripFlag = true;
	    }
	};

     //-------------------------------------------------------------------------

    this.dayTypeEnum = {
        unrecognised: 0,
        carryInTrip: 1,
        endOfDuty: 2,
        endOfTrip: 3,
        restDayAfterDuty: 4

    };

/*
    1234
     XXX - start of trip

      -  - rest day
    lgw  - carry in trip (end of trip if next day blank or start of trip)
*/
    this.getDayType = {

    }

    this.isEndOfTrip = function(dayNo) {
        var nextDayNo = dayNo + 1,
            nextDay = summaryDays[nextDay],
            result = true;

        if (nextDayNo > summaryDays.length) {
            result = false;
        }
        else {
            if (!nextDay.isStartOfTrip() &&
                nextDay.dest !='') {
                result = false;
            }
        }
        return result;
    };

    this.hasACarryInTrip = function() {
        return carryInTripFlag;
    };

    this.getDays = function() {
        return summaryDays;
    };

    this.processLine = function(line) {
        var finishedSummaryLines = false;

        summaryLines.push(line);
        if (nextLineIsDayOfWeekLine === true) {
            processSummaryLines();
            finishedSummaryLines = true;
        }
        if (testForDatesLine(line) === lte.datesLine) {
            nextLineIsDayOfWeekLine = true;
        }
        return finishedSummaryLines;
    };
};