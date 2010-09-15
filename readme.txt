Roster Processor notes (Mac OSX 20/11/08)


Version updating instructions


Update version no. (Do a replace in files for 0.1.1\d  regex) )

Build extension using xpibuild from rosterprocessor directory (sha1 hash is now automatically updated)

Run mcoy from Applications->Utilities to sign the update.rdf file

Update updateinfo.xml with info about the latest version.

Run ./sendToWeb to upload all relevant files to website
or
 use filezilla to copy update.rdf(!), updateinfo.xml & rosterprocessor.xpi(!) to website.

Log in to www.aircrewrosters.com & update the index, download & version history pages to reflect the latest version.

Note: zip in xpibuild needs an option specifying to prevent a new sha1 hash being generated every time it is run. Doesn't affect
output but 