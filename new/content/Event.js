/*globals YAHOO */

/* Copyright (c) 2006 YourNameHere
   See the file LICENSE.txt for licensing information. */
/*jslint white: false, devel: true */



/*
Example:
  4 SU 3308   2362 LGW 0445 0545 MRS 0735          2363 MRS 0810 LGW 1000 F        8037 LGW 1045 JER 1145
  5 MO 3308   8034 JER 0505 0605 LGW 0700 F        2560 LGW 0745 BLQ 0950          2561 BLQ 1035 LGW 1240

Sector:
    getStart - return start of flight 0545
    getEnd - return end of flight 0735
    getSummary - 2362 LGW-MRS
    getDescription 2362 LGW 0445 0545 MRS 0735
    getLength
    getCrew - return Crew names for sector
    getId - return Flight No
Duty:
    getStart - return report 0445
    getEnd - return clear 1215
    getSummary - R0445 G-MRS-GfJER C1215
    getDescription 2362 LGW 0445 0545 MRS 0735          2363 MRS 0810 LGW 1000 F        8037 LGW 1045 JER 1145
    getLength
    getCrew - return Crew names for duty
    getId - return trip no 3308
Trip:
    getId - return trip no 3308
    getCrew - return Crew names for trip
    getStart - return report 0445
    getEnd - return clear 1310
    getSummary - R0445 G-MRS-GfJER C1215
    getDescription:
	  4 SU 3308   2362 LGW 0445 0545 MRS 0735          2363 MRS 0810 LGW 1000 F        8037 LGW 1045 JER 1145
	  5 MO 3308   8034 JER 0505 0605 LGW 0700 F        2560 LGW 0745 BLQ 0950          2561 BLQ 1035 LGW 1240

*/

"use strict";

YAHOO.rp.EventDate = function() {
    var d = new Date(0),
	u = YAHOO.rp.utils;

    this.setTime = function(tm) {
	u.setHHMM({date: d, time: tm});
	this.peekDate = d;
    };
    this.setDate = function(bd) {
	if (typeof bd === 'number') {
	    d = new Date(bd);
	}
	else if (typeof bd === 'object') {
	    d = new Date(bd.valueOf());
	}
	this.peekDate = d;
    };
    this.setDayOfMonth = function(dy) {
	d.setUTCDate(dy);
 	this.peekDate = d;
    };
   
    this.setShortMonth = function(mmm) {
	var m = u.indexOfMonth(mmm);
	d.setUTCMonth(m);
    };
   
    this.incDate = function() {
	d = u.incUTCDay(d);
	this.peekDate = d;
    };

    this.decDate = function() {
	d = u.decUTCDay(d);
	this.peekDate = d;
    };

    this.incYear = function() {
	d = u.incUTCYear(d);
	this.peekDate = d;
    };

    this.decYear = function() {
	d = u.decUTCYear(d);
	this.peekDate = d;
    };

    this.incMonth = function() {
	d = u.incUTCMonth(d);
	this.peekDate = d;
    };

    this.decMonth = function() {
	d = u.decUTCMonth(d);
	this.peekDate = d;
    };
    
    this.isGreaterThan = function(otherDate) {
	return (d.valueOf() > otherDate.valueOf());
    }

    this.isLessThan = function(otherDate) {
	return (d.valueOf() < otherDate.valueOf());
    }

    this.valueOf = function() {
	return d.valueOf();
    };
    this.date = function() {
	return d;
    };
    
    this.clone = function() {
	var newEventDate = new YAHOO.rp.EventDate();
	newEventDate.setDate(d);
	return newEventDate;
    };
    this.ISO8601DateTime = function() {
	return u.ISO8601String(d);
    };
    this.ISO8601Date = function() {
	return u.ISO8601String(d,true);
    };
};

YAHOO.rp.eventMaker = function() {
    this.start = new YAHOO.rp.EventDate();
    this.end = new YAHOO.rp.EventDate();
    this.origin = '';
    this.destination = '';
    this.summary = '';
    this.description = '';
    this.rosterLine = '';
    this.dtStamp = new YAHOO.rp.EventDate();
    this.dtStamp.setDate(new Date());
    this.created = new YAHOO.rp.EventDate();
    this.lastModified = new YAHOO.rp.EventDate();
    this.categories = '';
    this.uuid = YAHOO.rp.utils.generateGUID();

};

YAHOO.rp.eventMaker.prototype.getSummary = function () {
	return this.summary;
};

YAHOO.rp.eventMaker.prototype.setSummary = function (s) {
	this.summary = s;
};

YAHOO.rp.eventMaker.prototype.getDescription = function () {
	return this.description;
};

YAHOO.rp.eventMaker.prototype.setDescription = function (d) {
	this.description = d;
};

YAHOO.rp.eventMaker.prototype.print = function() {
	console.log("Summary: " + this.getSummary());
	console.log("Description: " + this.getDescription());
	console.log("Start: " + this.start.date());
	console.log("End: " + this.end.date());
};

YAHOO.rp.eventMaker.prototype.getLength = function() {
    return this.end.valueOf() - this.start.valueOf();
};

YAHOO.rp.eventMaker.prototype.isWholeDay = function() {
    return false;
};

YAHOO.rp.eventMaker.prototype.postProcess = function() {
    console.log('Post Processing');
};

// the static factory method
YAHOO.rp.eventMaker.factory = function(eventType, defaultDate) {
    var constr = eventType, newEvent,
	em = YAHOO.rp.eventMaker;
    // error if the constructor doesn't exist
    if (typeof YAHOO.rp.eventMaker[constr] !== "function") {
	throw {
	    name: "Error",
	    message: constr + " doesn't exist"
	};
    }
    // at this point the constructor is known to exist
    // let's have it inherit the parent but only once
    if (typeof YAHOO.rp.eventMaker[constr].prototype.getSummary !== "function") {
	YAHOO.rp.eventMaker[constr].prototype = new YAHOO.rp.eventMaker();
    }
    // create a new instance
    newEvent = new YAHOO.rp.eventMaker[constr]();
    // optionally call some methods and then return...
    newEvent.start.setDate(defaultDate);
    newEvent.end.setDate(defaultDate);
    console.log("Creating new " + newEvent.name);
    return newEvent;
};

// define specific car makers
YAHOO.rp.eventMaker.Sector = function () {
    this.name = 'sector';
};

YAHOO.rp.eventMaker.FlyingDuty = function () {
    this.name = 'flyingDuty';
    this.flightNo = '';
    this.sectors = new YAHOO.rp.EventCollection();
};

YAHOO.rp.eventMaker.Trip = function () {
    this.name = 'trip';
    this.tripNo = '';
    this.duties = new YAHOO.rp.EventCollection();
};

YAHOO.rp.eventMaker.GroundDuty = function () {
    this.name = 'groundDuty';
    this.isWholeDay = function() {
	var c= YAHOO.rp.constants;
	return ((this.getLength() + c.ONEMINUTE) % c.WHOLEDAY === 0);
    };
};


YAHOO.rp.EventCollection = function() {

    var c = YAHOO.rp.constants;

//    this.events = (function() {
    return (function() {

	var eventsList = [],
	index = 0;

	return {
	    ev: eventsList,

	    all: function() {
		return eventsList;
	    },
	    add: function(e,key) {
		if (typeof key === 'undefined') {
		    eventsList[eventsList.length] = e;
		}
		else {
		    eventsList[key] = e;
		}
	    },

	    get: function(key) {
		return eventsList[key];
	    },

	    next: function() {
		var element;
		if (!this.hasNext()) {
		    return null;
		}
		element = eventsList[index]; // Do not trim - whitespace is important to parser
		index += 1;

		// skip blank lines
		return element;
	    },

	    hasNext: function() {
		return index < eventsList.length;
	    },

	    rewind: function() {
		index = 0;
	    },

	    current: function() {
		return eventsList[index];
	    },

	    push: function(e) {
		eventsList.push(e);
	    },

	    pop: function(e) {
		return eventsList.pop();
	    },

	    print: function(indent) {
		/*            var event,
		tab ="",
		i = 0,
		infoLines;

	    for (; i< indent; i += 1) {
		tab = tab + "-";
	    }

	    infoLines = getInfo().split("\n");
	    for (i=0; i < infoLines.length; i++) {
		//console.( tab  + infoLines[i] );
	    }

	    while (this.hasNext()) {
		event = this.next();
		event.print(indent + 5);
	    }
*/
	    }
	};
    } ());
};

/*
function trip() {
       this.tripNo = "0000";
       this.duties = [];
       this.crewList = [];
}

YAHOO.rp.Event = function () {
       var dtStamp = new Date();
       this.created = new Date(0);
       this.lastModified = new Date(0);
       this.startTime = new Date(0);
       this.endTime = new Date(0);
       this.categories = "";
       this.summary = "";
       this.description = "";
       this.wholeDay = false;
       this.showEvent = function() { return true; } ;
       this.showSectors = function() { return false; } ;
       var uuid = generateGUID();
       this.getUUID = function () { return( uuid ); };
       this.getCreated = function () {
	      return( this.created.toISO8601String(5));
       }
       this.getLastModified = function () {
	      return( this.lastModified.toISO8601String(5));
       }
       this.getDtStamp = function () {
	      return( dtStamp.toISO8601String(5));
       }
       this.getStartTime = function () {
	      if( this.wholeDay ) {
		     return( this.startTime.toISO8601String(3, true));
	      }
	      else {
		     return( this.startTime.toISO8601String(5, rosterprocessor_getBooleanPreference("rosterprocessor.useUTC", true)));
	      }
       }
       this.getEndTime = function () {
	    if( this.wholeDay ) {
		return( this.endTime.toISO8601String(3, true));
	    }
	    else {
		return( this.endTime.toISO8601String(5, rosterprocessor_getBooleanPreference("rosterprocessor.useUTC", true)));
	    }
       }
       this.getSummary = function () {
	    // remove multiple spaces
	    return(this.summary.replace(/ +/," "));
       }
       this.getDescription = function () {
	    return(this.description.replace(/ +/," "));
       }
}


public class Event {

	Event parent;
	private String summary;
	private String description;
	private Date startDate;
	private Date endDate;
	private Date created;
	private Date dateStamp;
	private UUID uuid;

	public Event() {
		this.created = new Date();
		this.dateStamp = new Date();
		this.startDate = new Date(0);
		this.endDate = new Date(0);
		this.parent = null;
		uuid = UUID.randomUUID();
	}

	public String getUUID() {
		return uuid.toString();
	}

	public void setUUID(String uuid) {
		this.uuid = UUID.fromString(uuid);
	}

	public Date getDateStamp() {
		return dateStamp;
	}

	public void add( Event eventComponent) {
		throw new UnsupportedOperationException();
	}

	public void remove( Event eventComponent) {
		throw new UnsupportedOperationException();
	}

	public Event getChild( int i ) {
		throw new UnsupportedOperationException();
	}

	public Event(Event parent) {
		this(); // Call the Event() constructor above.
		this.parent = parent;
	}

	public Iterator createIterator() {
		return new NullIterator();
	}

	public void setCreated(Date d) {
		this.created.setTime(d.getTime());
	}

	public Date getCreated() {
		return created;
	}
	public Date getEndDate() {
		return endDate;
	}

	public void setEndDate(Date d) {
		this.endDate.setTime(d.getTime());
	}

	public Date getStartDate() {
		return startDate ;
	}

	public void setStartDate(Date d) {
		this.startDate.setTime(d.getTime());
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description.trim();
	}

	public String getSummary() {
		return summary;
	}

	public void setSummary(String summary) {
		this.summary = summary.trim();
	}

	public boolean includeEvent() {
		return true;
	}

	public boolean isAllDay() {
		// Whole day time is 0000 - 2359 so add a minute
		long diff = getEndDate().getTime() - getStartDate().getTime();
		return ( ( diff % DateUtils.WHOLEDAY == 0) ||
				(( diff + DateUtils.ONEMINUTE ) % DateUtils.WHOLEDAY == 0) );
	}

	public String getInfo() {
		DateFormat df = DateFormat.getDateTimeInstance(DateFormat.DEFAULT, DateFormat.DEFAULT, Locale.UK);
		String eventInfo = "<Event>-------------------------------------------\nCreated:" +
		df.format(this.getCreated() ) + "\nStart:" + df.format(this.getStartDate() ) + "\nEnd:" +
		df.format(this.getEndDate()) + "\nSummary:";
		eventInfo += this.getSummary() + "\nDescription:\n" + this.getDescription() + "\n</Event>-------------------------------------------\n";
		return eventInfo;
	}

	public void print(int indent) {
		String tab ="";
		for (int i=0; i< indent; i++) { tab = tab + "-"; }
		String [] infoLines = getInfo().split("\n");
		for (int i=0; i < infoLines.length; i++) {
			System.out.println( tab  + infoLines[i] );
		}
	}

}

public class Sector extends Event {
	private ArrayList crew;
	private String flightNo, origin, dest, preFltCode, postFltCodes;

	public String getPreFltCode() {
		return preFltCode;
	}


	public void setPreFltCode(String preFltCode) {
		this.preFltCode = preFltCode;
	}


	public String getPostFltCodes() {
		return postFltCodes;
	}


	public void setPostFltCodes(String postFltCodes) {
		this.postFltCodes = postFltCodes;
	}


	public ArrayList getCrew() {
		return crew;
	}


	public void setCrew(ArrayList crew) {
		this.crew = crew;
	}


	public String getFlightNo() {
		return flightNo;
	}


	public void setFlightNo(String flightNo) {
		this.flightNo = flightNo;
	}


	public String getOrigin() {
		return origin;
	}


	public void setOrigin(String origin) {
		this.origin = origin;
	}


	public String getDest() {
		return dest;
	}


	public void setDest(String dest) {
		this.dest = dest;
	}


	public Sector() {
		crew = new ArrayList();
	}


	public String getInfo() {
		DateFormat df = DateFormat.getDateTimeInstance(DateFormat.DEFAULT, DateFormat.DEFAULT, Locale.UK);
		String eventInfo = "<Sector>-------------------------------------------\nCreated:";
		eventInfo += df.format(this.getCreated() ) + "\nPreFltCode:" + this.getPreFltCode();
		eventInfo += "\nFlight No:" + this.getFlightNo() + "\nOrigin:" + this.getOrigin();
		eventInfo += "\nOffBlocks:" + df.format(this.getStartDate() );
		eventInfo += "Z\nDest:" + this.getDest() + "\nOnBlocks:" + df.format(this.getEndDate());
		eventInfo += "Z\nPostltCodes:" + this.getPostFltCodes();
		eventInfo += "\nSummary:" + this.getSummary() + "\nDescription:\n" + this.getDescription();
		eventInfo += "\n</Sector>-------------------------------------------\n";
		return eventInfo;
	}


}
**
 * @author jon
 *
 *       baseEvent.call(this);
       this.tripNo = "0000";
       this.crewList = "";
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
// Mod Ver 0.1.16 07/09/08 - Removes BA_ from flight no on summary line
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
       // Function added in 0.1.16 - NEED TO TEST
	      return ( rosterprocessor_getBooleanPreference("rosterprocessor.ccSplitTrip", true) );
       }


public class Duty extends EventCollection {

	public String getInfo() {
		DateFormat df = DateFormat.getDateTimeInstance(DateFormat.DEFAULT, DateFormat.DEFAULT, Locale.UK);
		String eventInfo = "<Duty>-------------------------------------------\nCreated:" + df.format(this.getCreated() ) + "\nReport:" + df.format(this.getStartDate() ) + "L\nClear:" + df.format(this.getEndDate()) + "L\nSummary:";
		eventInfo += "\n</Duty>-------------------------------------------\n";
		return eventInfo;
	}




}

public class Trip extends EventCollection {

	private boolean fsSs;
	private int tripNo;

	public boolean getFsSs() {
		return fsSs;
	}

	public void setFsSs(boolean fsSs) {
		this.fsSs = fsSs;
	}

	public String getInfo() {
		DateFormat df = DateFormat.getDateTimeInstance(DateFormat.DEFAULT, DateFormat.DEFAULT, Locale.UK);
		String eventInfo = "<Trip>-------------------------------------------\nCreated:" + df.format(this.getCreated() ) + "\nReport:" + df.format(this.getStartDate() ) + "L\nClear:" + df.format(this.getEndDate()) + "L\nSummary:";
		eventInfo += this.getSummary() + "\nDescription:\n" + this.getDescription() + "\n</Trip>------------------------------------------\n";
		return eventInfo;
	}

	public int getTripNo() {
		return tripNo;
	}

	public void setTripNo(int tripNo) {
		this.tripNo = tripNo;
	}

}
*/
