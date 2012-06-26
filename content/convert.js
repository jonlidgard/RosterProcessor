/**************************************************************
This code is copyright of Jon Lidgard (jonlidgard@gmail.com).
Please do not copy, modify, or distribute without prior consent.

Version 0.1.25, April 20th, 2008.
***************************************************************/



debugger;

const WHOLEDAY=86400000;
const ONEMINUTE=60000;
const POSTFLIGHTDUTYTIME = 1800000; // 1/2 hour
const PREFLIGHTDUTYTIME = 3600000; // 1 hour
const LHRCCPREFLIGHTDUTYTIME = 4800000; // 01:20
const MINREST = 39600000; // 11 hours

//---------------------------- ROSTER OBJECTS -------------------------------                                          

function roster()
{
       this.document = null; // rp_getContentDocument();
       this.text = {all:"",header:"",body:"",footer:""};
       this.staffNo = "";
       this.nameCode = "";
       this.crewStatus = "";
       this.lastName = "";
       this.firstName = "";
       this.month = "";
       this.year = "";
       this.created = new Date();
       this.baseDate = new Date();
       this.infoLines = [];
       this.trips = [];
       this.duties = [];
       this.crewList = [];
       this.homeBase = "";
       this.parsePage = null;
       this.getFileName = null;
       this.getTitleString = function() { return ""; };
       this.getRosterText = function() {
              return this.text.body == '' ? this.text.all :
              this.text.header + this.text.body + this.text.footer; };
       this.getRawRosterText = function() {
              return rp_getContentDocument().body.textContent; };
       this.removeHeaderInfo = function() {
              this.text.all = this.text.all.replace(/Roster Processor.*$/img,"");    
              // This trims whitespace from the beginning & end of the roster, not on individual lines.
              this.text.all = this.text.all.replace(/^\s*|\s*$/g,"");
       }
       this.addFooterInfo = function() {
              var signature = rosterprocessor.strings.getString("rosterFooter");
              if ( !this.text.footer.match(signature))
              {
                     this.text.footer = this.text.footer + signature;
              }
       }
       this.getRosterInfo = null;
}

//---------------------DUTY OBJECTS ------------------------------------------------------
function trip()
{
       this.tripNo = "0000";
       this.duties = [];
       this.crewList = [];
}

function baseEvent()
{
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
       this.getCreated = function ()
       {
              return( this.created.toISO8601String(5));
       }
       this.getLastModified = function ()
       {
              return( this.lastModified.toISO8601String(5));
       }
       this.getDtStamp = function ()
       {
              return( dtStamp.toISO8601String(5));
       }
       this.getStartTime = function ()
       {
              if( this.wholeDay )
              {
                     return( this.startTime.toISO8601String(3, true));                     
              }
              else
              {
                     return( this.startTime.toISO8601String(5, rosterprocessor_getBooleanPreference("rosterprocessor.useUTC", true)));
              }
       }
       this.getEndTime = function ()
       {
              if( this.wholeDay )
              {
                     return( this.endTime.toISO8601String(3, true));                     
              }
              else
              {
                     return( this.endTime.toISO8601String(5, rosterprocessor_getBooleanPreference("rosterprocessor.useUTC", true)));
              }
       }
       this.getSummary = function ()
       {
              // remove multiple spaces       
              return(this.summary.replace(/ +/," "));
       }
       this.getDescription = function ()
       {
              return(this.description.replace(/ +/," "));
       }
}

function groundDuty(summary, description, creationDate)
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
              var optionOffDays = rosterprocessor_getBooleanPreference("rosterprocessor.fcShowOffDays", true);
              var optionWrapDays = rosterprocessor_getBooleanPreference("rosterprocessor.fcShowWrapDays", true);
              var optionLeaveDays = rosterprocessor_getBooleanPreference("rosterprocessor.fcShowLeaveDays", true);
              var dontShowIt =                     
                   (!optionOffDays && this.dutyCode in set('OFF','IN')) ||
                   (!optionWrapDays && this.dutyCode == 'WR') ||
                   (!optionLeaveDays && this.dutyCode in set('LM','LP','LA','LB','3A','3B','LL'));

              return !dontShowIt;
       }
}

groundDuty.prototype = new baseEvent();

function flyingDuty(summary, description, creationDate)
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
       this.reportDefined = false; // Set if the report time came from the roster & not a calc'd time.
       this.straddleFlag = false; // Set if duty straddles a month boundary
       this.showSectors = function()
       {
       //Function added in 0.1.25
       // Need to Test
              var tmpSector;
              var result = rosterprocessor_getBooleanPreference("rosterprocessor.fcSplitTrip", true);
              for( var s in this.sectors )
              {
                 tmpSector = this.sectors[s];
                 if ( tmpSector.isSim() ) {
                     result = true;
                     break;
                 }
              }
              return( result );
       } ;
       this.getSummary = function()
       {
              if ( rosterprocessor_getBooleanPreference("rosterprocessor.fcNoSummary", false) )
                     return this.description;


              var summaryLine,orig,dest,lastDest = '';
              var tmpSector = this.sectors[0];
              var separator; // normally '-' but  '*' for a positioning sector
              summaryLine = "R" + this.startTime.toISO8601String(7) + "Z ";
//               abbrevBase(tmpSector.origin.IATA);
              if ( rosterprocessor_getBooleanPreference("rosterprocessor.fcShowFltNo", true))
              {
                     summaryLine = summaryLine + tmpSector.flightNo + " ";
              }

              fixedLink = false;
              for( var s in this.sectors )
              {
                 tmpSector = this.sectors[s];
                 separator = fixedLink ? 'f' : '-';
                 separator = (tmpSector.postFltCodes.substring(0,1) == 'X') ? 'x' : separator;
                 separator = (tmpSector.preFltCode == 'DH') ? '*' : separator;
                 fixedLink = (tmpSector.postFltCodes.substring(0,1) == 'F');
                 LOG(10,"Pst FLt Codes " + tmpSector.postFltCodes);
                 LOG(10,"Fixed Link " + fixedLink);
                 LOG(10,"Summary Line " + summaryLine);
                 if( tmpSector.origin.IATA != lastDest)
                 {
                     summaryLine = summaryLine + ((lastDest == '') ? '' : separator);
                     summaryLine = summaryLine + abbrevBase(tmpSector.origin.IATA);
                 }
                 lastDest = tmpSector.dest.IATA;
                 summaryLine = summaryLine + separator + abbrevBase(lastDest);
              }
              summaryLine = summaryLine + " C" + this.endTime.toISO8601String(7) + "Z";
              if ( rosterprocessor_getBooleanPreference("rosterprocessor.fcCrewOnSummary", true))
              {
                     summaryLine = summaryLine + " " + abbrevName(this.crewList);
              }                     
              return summaryLine;
       }

}

flyingDuty.prototype = new baseEvent();

function flightSector( creationDate )
{
       baseEvent.call(this);
       this.created = new Date(creationDate.valueOf());
       this.lastModified = new Date(creationDate.valueOf());
       this.preFltCode = ""; // code, e.g. DH applied before flight no'
       this.postFltCodes = ""; // codes, e.g. CK,CP, applied after sector details
       this.flightNo = "";
       this.origin = {IATA:"",ICAO:"",NAME:""};
       this.dest = {IATA:"",ICAO:"",NAME:""};
       this.acReg = "";
       this.crewList = "";
       this.capacity = "P1";

       this.isSim = function () {
              var x = ( this.origin.IATA == 'LHR' ) && ( this.dest.IATA == 'LHR' );
              return ( x && (this.flightNo ==  '') );
       }

       this.loggable = function()
       {
              var result = true, nonLoggablePreFltCodes = ['DH'],
                                 nonLoggableFlightNos = ['LIMO'];

              for( var i in nonLoggablePreFltCodes )
              {
                     if (this.preFltCode == nonLoggablePreFltCodes[i]) { result = false;}
              }
              for( var i in nonLoggableFlightNos )
              {
                     if (this.preFltCode == nonLoggableFlightNos[i]) { result = false;}
              }
              return ( result && !this.isSim() );
       };
       this.getSummary = function()
       {
              if ( rosterprocessor_getBooleanPreference("rosterprocessor.fcNoSummary", false) )
                     return this.description;


              var separator, summaryLine = '';
              if ( rosterprocessor_getBooleanPreference("rosterprocessor.fcShowFltNo", true) && this.flightNo != '')
              {
                     summaryLine = this.flightNo + " ";
              }
              separator = (this.postFltCodes.substring(0,1) == 'X') ? 'x' : '-';
              separator = (this.preFltCode == 'DH') ? '*' : separator;
              
              var simFlag = this.isSim() || this.preFltCode == 'LIMO';
              var o = simFlag ? '' : abbrevBase(this.origin.IATA);
              var d = simFlag ? '' : abbrevBase(this.dest.IATA);
              summaryLine = summaryLine + o;
              summaryLine = summaryLine + this.startTime.toISO8601String(7);
              summaryLine = summaryLine + separator;
              summaryLine = summaryLine + d;
              summaryLine = summaryLine + this.endTime.toISO8601String(7);
              
              if ( separator == '-') {
                     summaryLine = trimString(this.preFltCode) + ' ' + summaryLine + ' ' + this.postFltCodes;
              }
              //if ( rosterprocessor_getBooleanPreference("rosterprocessor.fcCrewOnSummary", true))
              //{
              //       if ( trimString(this.preFltCode) != 'LIMO' ) { // dont add crew names to LIMO sectors
              //              summaryLine = summaryLine + " " + abbrevName(this.crewList);
              //       }
              //}                     

              summaryLine = trimString(summaryLine);
              LOG(10,"Pst FLt Codes " + this.postFltCodes);
              LOG(10,"Summary Line " + summaryLine);
              return summaryLine;
       }

}

flightSector.prototype = new baseEvent();

function flightCrew()
{
       this.date = new Date;
       this.tripNo = "";
       this.names = "";
}


/*
var xcalParser = {
       
       createXcalTree: function() {
              this.xcal = document.implementation.createDocument(ICALNS,'xcal',null);
              xcal.createElement("iCalendar");
              this.VcalElement = doc.createElement();
       }
};
*/


