Roster Processor notes (Mac OSX 20/11/08)


Version updating instructions


~/workspace/rosterprocessor holds the latest source
Version control for this directory via Git & GitHub

Website Files are now served from virgin media website.
Cyberduck has an account set up for this.
Dreamweaver CS5 does too.
Password held in keychain access app under ftp.webspace.virginmedia.com
Local copy of site stored at ~/Sites/AircrewRosters/htdocs

'Firefox4 dev' profile used for development & points to ~/workspace/rosterprocessor

Updating instructions (As of v0.1.24 / 13/03/11)

Update version no. (Do a replace in files for 0.1.1\d  regex) )
Update version no. in rosterprocessor.dtd

When ready to deploy

Update updateInfo.xml & website's index.html

Run /usr/local/bin/xpibuild
This runs pre-build script xpi_pre_build & post build script xpi_post_build
Pre-build script backs up files.
sha1 updating done automatically
Post build runs McCoy.. Use this to sign update.rdf

Run /usr/local/bin/xpi_upload script to copy files to local & remote web servers


Note: zip in xpibuild needs an option specifying to prevent a new sha1 hash being generated every time it is run. Doesn't affect
output but makes it impossible to compare rosterprocessor versions by sha1 hash. 
