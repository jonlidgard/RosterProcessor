/**************************************************************
This code is copyright of Jon Lidgard (jonlidgard@gmail.com).
Please do not copy, modify, or distribute without prior consent.

Version 0.1.24, April 20th, 2008.
***************************************************************/



debugger;

const ICAL =   {V1_HEADER:'BEGIN:VCALENDAR\nVERSION:1.0\nPRODID:-//www.aircrewrosters.com/NONSGML Roster Calendar V0.1.23//EN\n',
                V2_HEADER:'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//www.aircrewrosters.com/NONSGML Roster Calendar V0.1.23//EN\n',
                TIMEZONE_INFO:'BEGIN:VTIMEZONE\nTZID:/aircrewrosters.com/20070129_1/Europe/London\nX-LIC-LOCATION:Europe/London\nBEGIN:DAYLIGHT\nTZOFFSETFROM:+0000\nTZOFFSETTO:+0100\nTZNAME:BST\nDTSTART:19700329T010000\nRRULE:FREQ=YEARLY;INTERVAL=1;BYDAY=-1SU;BYMONTH=3\nEND:DAYLIGHT\nBEGIN:STANDARD\nTZOFFSETFROM:+0100\nTZOFFSETTO:+0000\nTZNAME:GMT\nDTSTART:19701025T020000\nRRULE:FREQ=YEARLY;INTERVAL=1;BYDAY=-1SU;BYMONTH=10\nEND:STANDARD\nEND:VTIMEZONE\n',
                CAL_FOOTER:'END:VCALENDAR\n',
                EVENT_HEADER:'BEGIN:VEVENT\n',
                EVENT_FOOTER:'END:VEVENT\n'};


// rfc2445 states that times expressed in UTC should NOT use the TZID property
const TZIDcode = ';VALUE=DATE;TZID=/www.aircrewrosters.com/20070129_1/Europe/London:';

function outputICAL(theRoster)
{
    var rptText = "";
    this.outputText = "";
    TZID = rosterprocessor_getBooleanPreference("rosterprocessor.useUTC", true) ? TZIDcode : ":";
    TZINFO = rosterprocessor_getBooleanPreference("rosterprocessor.useUTC", true) ? ICAL.TIMEZONE_INFO : "";
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
        this.outputText = this.outputText.concat(calHeader);
    }
    function outputFooter()
    {
        this.outputText = this.outputText.concat(ICAL.CAL_FOOTER);
    }
    function outputEvent(theEvent)
    { 
        var mySector,crewLine,firstSector = true;

        if ( theEvent.showSectors() )
        {
            for ( mySector in theEvent.sectors )
            {
                with (theEvent.sectors[mySector])
                {
                    this.outputText = this.outputText.concat(ICAL.EVENT_HEADER);
                    this.outputText = this.outputText.concat('CREATED:' + getCreated() + "\n");
                    this.outputText = this.outputText.concat('LAST_MODIFIED:' + getLastModified() + "\n");
                    this.outputText = this.outputText.concat('DTSTAMP:' + getDtStamp() + "\n");
                    this.outputText = this.outputText.concat('UID:' + getUUID() + "\n");
                    if ( firstSector )
                    {
                        crewLine = " " + abbrevName(crewList);
// Mod 0.1.24 - need to switch between L & Z for cc or fc rosters
//                        rptText = "RPT" + theEvent.startTime.toISO8601String(7,false) + "Z ";
                        rptText = '';
                        this.outputText = this.outputText.concat('DTSTART' + TZID + theEvent.getStartTime() + "\n");
                    }
                    else
                    {
                        rptText = '';
                        crewLine = '';
                    }
                    this.outputText = this.outputText.concat('DTSTART' + TZID + getStartTime() + "\n");
                    firstSector = false;
                    this.outputText = this.outputText.concat('DTEND' + TZID + getEndTime() + "\n");
                    this.outputText = this.outputText.concat('SUMMARY:' + rptText + getSummary() + crewLine + "\n");
                    this.outputText = this.outputText.concat('DESCRIPTION:' + getDescription() + "\n");
                    this.outputText = this.outputText.concat('CATEGORIES:' + categories + "\n");
                    this.outputText = this.outputText.concat(ICAL.EVENT_FOOTER);
                }
            }
        }
        else
        {
        if( theEvent.showEvent() )
        {
//            this.outputText = this.outputText.concat("***Duty***\n");
        this.outputText = this.outputText.concat(ICAL.EVENT_HEADER);
        this.outputText = this.outputText.concat('CREATED:' + theEvent.getCreated() + "\n");
        this.outputText = this.outputText.concat('LAST-MODIFIED:' + theEvent.getLastModified() + "\n");
        this.outputText = this.outputText.concat('DTSTAMP:' + theEvent.getDtStamp() + "\n");
        this.outputText = this.outputText.concat('UID:' + theEvent.getUUID() + "\n");
        this.outputText = this.outputText.concat('DTSTART' + TZID + theEvent.getStartTime() + "\n");
        this.outputText = this.outputText.concat('DTEND' + TZID + theEvent.getEndTime() + "\n");
        this.outputText = this.outputText.concat('SUMMARY:' + theEvent.getSummary() + "\n");
        this.outputText = this.outputText.concat('DESCRIPTION:' + theEvent.getDescription() + "\n");
        if( theEvent.wholeDay )
        {
            this.outputText = this.outputText.concat("TRANSP:TRANSPARENT\n");
        }
        if( theEvent.categories != "")
        {
            this.outputText = this.outputText.concat('CATEGORIES:' + theEvent.categories + "\n");
        }
        this.outputText = this.outputText.concat(ICAL.EVENT_FOOTER);
        }
        }
    }
    
    // Add the header
    outputHeader();
    // Add the events
    var event;
    for ( event in theRoster.duties )
    {
        outputEvent(theRoster.duties[event]);
    }

    outputFooter();
    return this.outputText;

};

/*
function rosterBAFlightCrew()
{
       myXML = '<?xml version="1.0" encoding="UTF-8"?> \
               <roster name-code="" publish-date=""> \
              <employee first-name="" middle-initial="" last-name="" staff-number="" position="" seniority=""> \
              <company name=""/><fleet base=""><aircraft></aircraft> \
              </fleet><contact><email></email><telephone><home></home> \
              <mobile></mobile></telephone></contact></employee> \
              <duties start-date="" end-date="" credit-hours="" block-hours=""> \
              </duties><remarks></remarks></roster>';
       
       var that = this; // allows member function to access private properties, e.g. that.nameCode
       this.nameCode = "";
//       this.staffNo = "";
//       this.crewType = "";
       this.date = new Date();
//       this.homeBase = "";
       this.seniority = 0;
       this.fleet = "";
       this.rosterType = "UNKNOWN";
       this.publishedDutyHours = "";
//       this.month = "";
//       this.year = "";

//       this.baseDate = new Date();
//       this.duties = [];
       this.xroster = null;
/*       
       // create the xml document from the template string
       var xmlParser = new DOMParser();
       var domTree = parser.parseFromString(myXML, "text/xml");
       
       if (domTree.documentElement.nodeName == "parsererror")
       {
              throw new RosterException("Couldn't parse xroster template string");
       }
       else
       {
              this.xroster = domTree.documentElement;
       }

       if( DEBUG )
       {
              dump("---xroster nodeName -----\n" + xroster.nodeName + "\n------------\n");
       }

       this.setAttribute = function(id,attribute,value)
       {
              that.domTree.getElementById(id).setAttribute(attribute, value);
       }
       this.serialize = function(filePath)
       {
              try
              {
                     var serializer = new XMLSerializer();
                     var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                      .createInstance(Components.interfaces.nsIFileOutputStream);
                     foStream.init(filePath, 0x02 | 0x08 | 0x20, 0664, 0);   // write, create, truncate
                     serializer.serializeToStream(that.domTree, foStream, "");   // rememeber, doc is the DOM tree
              }
              finally
              {
                     foStream.close();
              }
       }


};

// Inherit from roster
rosterBAFlightCrew.prototype = new roster();
*/



function outputXML(theRoster)
{
      var doc = document.implementation.createDocument("", "", null);     
      var rosters = doc.createElement("rosters");
      var employee = doc.createElement("employee");
      var roster = doc.createElement("roster");
      
     
    function setEmployeeElement()
    {
        employee.setAttribute("staff-number", theRoster.staffNo);        
        employee.setAttribute("name-code", theRoster.nameCode);        
        employee.setAttribute("first-name", theRoster.firstName);        
        employee.setAttribute("last-name", theRoster.lastName);        
        employee.setAttribute("seniority", theRoster.seniority);        
        employee.setAttribute("position", theRoster.crewType);        
        employee.setAttribute("base", theRoster.homeBase);
    }

    function addDuty(theDuty)
    { 
       dump("Here1\n");
       var mySector;
       var dutyElem = doc.CreateElement("duty");
       dump("Here1\n");
        dutyElem.setAttribute("uuid", theDuty.getUUID());
       dump("Here1\n");
        dutyElem.setAttribute("summary", theDuty.getSummary());
       dump("Here1\n");

        if ( theDuty instanceof flyingDuty )
        {
       dump("Here2\n");
            for ( mySector in theDuty.sectors )
            {
                with (theDuty.sectors[mySector])
                {
                    sectorElem = doc.CreateElement("sector");
                    sectorElem.setAttribute("uuid", mySector.getUUID());
                    sectorElem.setAttribute("summary", mySector.getSummary());
                    //this.outputText = this.outputText.concat('CREATED:' + getCreated() + "\n");
                    //this.outputText = this.outputText.concat('LAST_MODIFIED:' + getLastModified() + "\n");
                    //this.outputText = this.outputText.concat('DTSTAMP:' + getDtStamp() + "\n");
                    //this.outputText = this.outputText.concat('DTSTART' + TZID + getStartTime() + "\n");
                    //this.outputText = this.outputText.concat('DTEND' + TZID + getEndTime() + "\n");
                    //this.outputText = this.outputText.concat('DESCRIPTION:' + getDescription() + "\n");
                    //this.outputText = this.outputText.concat('CATEGORIES:' + categories + "\n");
                    dutyElem.appendChild(sectorElem);
                }
            }
        }

        roster.appendChild(dutyElem);
    }
    
           dump("Here\n");

    setEmployeeElement();
           dump("Here0\n");
    
   
       // Add the duties
       roster.setAttribute("month",theRoster.baseDate.getUTCMonth() + 1);
       roster.setAttribute("year",theRoster.baseDate.getUTCFullYear());
       roster.setAttribute("type",theRoster.getRosterType());
       roster.setAttribute("block-hours",theRoster.publishedDutyHours.toHHMMString());
           dump("Here01\n");

       var duty;
       for ( duty in theRoster.duties )
       {
         addDuty(theRoster.duties[duty]);
       }
           dump("Here3\n");

        employee.appendChild(roster);
       rosters.appendChild(employee);
       doc.appendChild(rosters);


    return doc;
};