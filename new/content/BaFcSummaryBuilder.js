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

                newDay = {};
                newDay.date = theDate;
                newDay.dayOfWeek = theDay;
                newDay.dest = theDest;
                newDay.trip = theTrip;
                newDay.gndDuties = [];

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