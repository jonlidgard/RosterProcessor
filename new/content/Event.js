/* Copyright (c) 2006 YourNameHere
   See the file LICENSE.txt for licensing information. */


YUI().add('rpEvent', function (Y) {
//    Y.namespace('rp.event');

    Y.rp.Event = function () {
        this.summary = '';
        this.description = '';
    },


    Y.rp.EventCollection = (function () {

        var events = [],
            index = 0;
    
        return {
            newEvent: function () {
        	var event = new YAHOO.rosterProcessor.Event;
                events.push(event);
	  	return event;
	    },
        
	    next: function() {
	        var element;
	        if (!this.hasNext()) {
	            return null;
	        }
	        element = events[index]; // Do not trim - whitespace is important to parser
	        index += 1;
    
	        // skip blank lines
	        return element;
	    },
    
	    hasNext: function() {
	        return index < events.length;
	    },

	    reset: function() {
	        index = 0;
	    },

	    print: function(indent) {
	        var event,
	            tab ="",
	            i = 0;
	    
                for (; i< indent; i += 1) {
	            tab = tab + "-";
	        } 
	    
	        infoLines = getInfo().split("\n");
	        for (i=0; i < infoLines.length; i++) {
		    console.( tab  + infoLines[i] );
		}

		while (this.hasNext()) {
		    event = this.next();
		    event.print(indent + 5);
		}
	    }	
        }
    } ());

/*
function trip() {
       this.tripNo = "0000";
       this.duties = [];
       this.crewList = [];
}

YAHOO.rosterProcessor.Event = function () {
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


/*
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
}, '0.1', {requires: ['rpUtils']} );