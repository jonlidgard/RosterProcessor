/* Copyright (c) 2006 YourNameHere
 
  See the file LICENSE.txt for licensing information. */


function outputLogbook(theRoster)
{
    var rptText = "";
    this.outputText = "";
    this.totalHours = new Date(0);

    function outputLogHeader()
    {
        var logHeader = ""; 
        this.outputText = this.outputText.concat(logHeader);
    }
    function outputLogFooter()
    {
        var logFooter = "\t\t\t\t\t\t\tTotal Flying hours for month:\t" + this.totalHours.toHHMMString() + "\n";
        this.outputText = this.outputText.concat(logFooter);
    }
    
    function outputEvent(theEvent, rosterMonth)
    { 
        var mySector,crewLine,firstSector = true;

        if ( theEvent instanceof flyingDuty )
        {
            for ( mySector in theEvent.sectors )
            {
                theSector = theEvent.sectors[mySector];
                dump("SectorMonth " + theSector.startTime.getUTCMonth() + "\n");   
                if ( theSector.loggable() && ( theSector.startTime.getUTCMonth() == rosterMonth ))
                {

                    this.outputText = this.outputText.concat(theSector.startTime.toShortDate() + "\t\t\t");

    //              if( theRoster.crewStatus == 'CA' ) {
                      this.outputText = this.outputText.concat("Self\t\t\t");
/*                    }
                    else {
                       this.outputText = this.outputText.concat("\tSelf\t\t");
                    }
     */                   
                    this.outputText = this.outputText.concat(theSector.origin.IATA + "\t");
                    this.outputText = this.outputText.concat(theSector.dest.IATA + "\t");
                    this.outputText = this.outputText.concat(theSector.startTime.toHHMMString(":",true) + "\t");
                    this.outputText = this.outputText.concat(theSector.endTime.toHHMMString(":",true) + "\t");
                    
                    sectorLength =  new Date( theSector.endTime.valueOf() - theSector.startTime.valueOf());
                    this.totalHours = new Date(this.totalHours.valueOf() + sectorLength.valueOf());
 //                   sectorLength = new Date(Date.timeDiff(theSector.startTime, theSector.endTime));
                    this.outputText = this.outputText.concat(sectorLength.toHHMMString() + "\n");
                }
            }
        }
    }
    
    // Add the header
    outputLogHeader();
    // Add the events
    var event;
    var rosterMonth = theRoster.baseDate.getUTCMonth();
    dump("RosterMonth " + rosterMonth + "\n");   
     for ( event in theRoster.duties )
    {
        outputEvent(theRoster.duties[event], rosterMonth);
    }

    outputLogFooter();
    return this.outputText;

};


/* 

void __fastcall TOutput::SaveAsLogBook()
{
TFlightSector *Sector;
TStrings* OutputText = Roster->Lines;
AnsiString OrigName,DestName,line;
TDateTime Day,Night;
double dist;
   if( Options->BoolOptions["lFieldNames"][1] )
      OutputText->Add(GetLogBookHeader());
   for(int i=0;i < Roster->Count; i++) {
      if( Roster->Trip[i] ) {
         Sector = static_cast<TFlightSector *>(Roster->Trip[i]);
         if( AnsiString(Sector->ClassName()) == "TFlightSector") {
            GetNightHours(Sector,&OrigName,&DestName,&Day,&Night,&dist);
            line = Sector->StartDateTime.FormatString("dd/mm/yy");
            line +=  "\t\t\t";
            if( Roster->IsCommander )
               line += "Self\t\t\t";
            else
               line += "\tSelf\t\t";
            line += Sector->Origin + Tab;
            if( Options->BoolOptions["lAptNames"][0])
               line += OrigName + Tab;
            line += Sector->Destination + Tab;
            if( Options->BoolOptions["lAptNames"][0])
               line += DestName + Tab;
            line += Sector->StartTime + Tab + Sector->EndTime + Tab +
               Day.FormatString("hh:mm") + Tab + Night.FormatString("hh:mm");
            if( Options->BoolOptions["lDistances"][0] && OrigName != "" && DestName != "" )
                line += Tab + FormatFloat("#",dist);
            OutputText->Add(line);
         }
      }
   }
}
*/