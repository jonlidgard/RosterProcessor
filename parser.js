x =  'LIMO   LGW 0830 0840 LHR 1000        SM     LHR 1100 LHR 1500        LIMO   LHR 1530 LGW 1700       ';
lastflag=false;
do {
print("Sector:0123456789012345678901234567890123456789012345678901234567890\n");
print(x);
print(x.substring(32));
var matchNextSector = /[A-Z ]{2}[A-Z0-9 ]{4} [A-Z]{3}/;
y = 31 + x.substring(31).search(matchNextSector);
z = x.substring(0,y)  ;
if ( y== 32 )
{
y = x.length;
lastflag = true;
}
print("startOfNextSector:" + y);
print("sectorsection:" + z + "_");
x = x.substring(y);
print("Next section:" + x + "_");
print("-----------------------------");
} while (!lastflag)