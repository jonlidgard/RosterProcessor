var Database =
{
		PRAGMA_T_INFO_F_NAME: 1,
		PRAGMA_T_INFO_F_TYPE: 2,

    storageService: null,   // mozIStorageService
    dataConnection: null,   // Connection to current database (mozIStorageConnection)
    aTableData: null,       // Stores 2D array of table data
    aColumns: null,         // Stores array of column information (col#, ordered, type)

		colNameArray: null,
		resultsArray: null,
		statsArray: null,

		sErrorMessage: null,
		sExceptionName: null,
		sExceptionMessage: null,
		sExceptionLocation: null,
				
    // ConnectToDatabase: Connects and sets dataConnection
    ConnectToDatabase: function(nsIFile)
    {   
        if (this.storageService == null)
            this.Initialize();

        this.ResetDatabaseConnection();

				try
				{
	        this.dataConnection = this.storageService.openDatabase(nsIFile);
					// if the db does not exist it does not give us any indication
					// this.dataConnection.lastErrorString returns "not an error"
				}
				catch (e)
				{
					this.onSqlError(e, "Error in opening file " + nsIFile.leafName + 
													   " - perhaps, this is not an sqlite db file", null);
				}
				
				if(this.dataConnection == null)
					return false;
				
				return true;
    },

    // ResetDatabaseConnection: Free the database resource lock (right now this doesn't do much)
    ResetDatabaseConnection: function() 
    {
        if (this.dataConnection != null)
            this.dataConnection = null; // There appears to be no API to clear a database connection       
        this.aTableData = null;
        this.aColumns = null;
    },

    // Get the mozIStorageService object
    Initialize: function()
    {
        // Get database storage service
        this.storageService = Components.classes["@mozilla.org/storage/service;1"]
          .getService(Components.interfaces.mozIStorageService);
    },

    // getObjectList: Retuns an array of names of type=argument 
		// in the current database. Type = table|index|view|trigger
    getObjectList: function(sObjectType) 
    {
    		return this.getSchemaArray(sObjectType);
    },
    
    //getSchemaArray: must return an array, empty array if no object found
    //calling functions can evaluate the returned value's length property
    //and if it is 0, it means corresponding objects do not exist in the database
    getSchemaArray: function(sType)
    {
        var aResult = new Array();
        var iCount = 0;
        
        var sQuery = "SELECT name FROM sqlite_master WHERE type = '"
							+ sType + "' ORDER BY name";

        try {
            var stmt = this.dataConnection.createStatement(sQuery);
            while (stmt.executeStep()) 
            {
                iCount++;
                aResult.push(stmt.getString(0));
            }
        } catch (e) {
            throw "Unable to get master list: " + e;
        }        
				//return the populated array or the empty array        
       	return aResult;
    },

    // loadTableData: Retrieve and save the table data from the storage object
    loadTableData: function(sTable)
    {
        if(!this.dataConnection.tableExists(sTable))
        {
            return false;
        }           
        //find whether the rowid is needed 
				//or the table has an integer primary key
				var rowidcol = this.getTableRowidCol(sTable);
				var extracol = "";
				if (rowidcol["name"] == "rowid")
					extracol = " rowid, ";
        //table having columns called rowid behave erratically
				this.selectQuery("SELECT " + extracol + " * FROM '" + sTable + "'");
				return true;
		},
		
    // getRecords: return aTableData 
    getRecords: function()
    {
      return this.aTableData;         
		},
		
    // getColumns: return aColumns 
    getColumns: function()
    {
      return this.aColumns;         
		},
		
    // selectQuery : execute a select query and store the results
    selectQuery: function(sQuery)
    {
        var iType;
        
        var cell;
        var bResult; 

        this.aTableData = new Array();
//        this.aTableData = null;
// if aColumns is not null, there is a problem in tree display
//				this.aColumns = new Array();
        this.aColumns = null;        
        bResult = false;

		 
        try 
				{
					// mozIStorageStatement
          var stmt = this.dataConnection.createStatement(sQuery);
				}
				catch(e)
				{
					// statement will be undefined because it throws error);
					this.onSqlError(e, "Likely SQL syntax error: " + sQuery, 
									this.dataConnection.lastErrorString);
					//statement.reset;  //if it gets here and a statement does not exist, it says "Statement has no properties"
					return false;
				}
				
				try 
				{
	        var iRows = 0;
					var iCols = 0;
					// We must run this once before we can get the column info
					bResult = stmt.executeStep(); 
					if(bResult)
					{
			      // if you use statement.columnCount in the for loops, it looks like it 
			      // goes over to C++ land to get this already known value 
			      iCols = stmt.columnCount; 
						iRows++;
						this.aColumns = new Array();
						var aTemp;
						for (var i = 0; i < iCols; i++)
						{
//							this.colNameArray.push(statement.getColumnName(i));
            	iType = stmt.getTypeOfIndex(i);
              //iType = 3;
              aTemp = new Array();
              aTemp.push(i);   // Index into the table array
              // Type; 0=null, 1=int, 2=float, 3=string, 4=blob
              aTemp.push(iType);     
                
              // Add this column information using the named column
              this.aColumns[stmt.getColumnName(i)] = aTemp;  
 						}
 					}
					else
					{
							// might as well bail 
							//alert("No Results from query " + sQuery);
							//statement.reset; //throws an exception
							return 0;
					}
        } catch (e) 
        { 
            throw "executeStep failed the very first time: " +  e;
        }

        try 
				{
            while (bResult) 
						{
                aTemp = new Array();
                for (i = 0; i < iCols; i++) 
								{
                    iType = stmt.getTypeOfIndex(i);
                    switch (iType) {
                        case 0: cell = "<null>";                break;
                        //use getInt64, not getInt32 otherwise long int
                        // as in places.sqlite/cookies.sqlite shows funny values
                        case 1: cell = stmt.getInt64(i);        break;
                        case 2: cell = stmt.getDouble(i);       break;
                        case 3: cell = stmt.getString(i);       break;
                        case 4: cell = stmt.getString(i);       break; // BLOB
                        default: sData = "<unknown>"; 
                    }
                    aTemp.push(cell);
                }
                iRows++;
                this.aTableData.push(aTemp);
                bResult = stmt.executeStep();
            }
        } catch (e) 
        { 
            throw "Table '" + this.sCurrentTable + "' data load failed; " + e;
        }
        return 0;
    },
    
    // getTableColumns : execute a pragma query and return the results
    getTableRowidCol: function(sTableName)
    {
				var sQuery = "PRAGMA table_info('" + sTableName + "')";
				this.selectQuery(sQuery);
				var aReturn = [];
				for(var i = 0; i < this.aTableData.length; i++)
				{
					var row = this.aTableData[i];
					var type = row[this.aColumns['type'][0]];
					var pk = row[this.aColumns['pk'][0]];
					type = type.toUpperCase();
					if(pk == 1 && type == "INTEGER")
					{
						var name = row[this.aColumns['name'][0]];
						var cid = row[this.aColumns['cid'][0]];
						aReturn['name'] = name;
						aReturn['cid'] = cid;
						return aReturn;
					}
				}
				aReturn['name'] = "rowid";
				aReturn['cid'] = 0;
				return aReturn;
    },
    
    // getTableColumns : execute a pragma query and return the results
    getTableColumns: function(sTableName)
    {
				var sQuery = "PRAGMA table_info('" + sTableName + "')";
				this.selectQuery(sQuery);
				
				var aResult = [this.aTableData, this.aColumns];
				return aResult;
    },
    
    // getTableInfo : execute a pragma query and return the results
    getTableInfo: function(sTableName,ciInfoType)
    {
				var aResult = [];
				var sQuery = "PRAGMA table_info('" + sTableName + "')";
				this.selectQuery(sQuery);
				aResult['numFields'] = this.aTableData.length;

				//return required fields only
				//0 is something
				//1 is fieldname
				//2 is type
				//3, 4, 5 are something (primary key, etc.)
        //if(ciInfoType == -1)
        	//return this.aTableData;

       	var iRequiredField = ciInfoType;
				var aReturn = new Array();

        if(ciInfoType >= 0) //should also check for ciInfoType <= no of columns
				{
					for(var i = 0; i < this.aTableData.length; i++)
					{
						aReturn.push(this.aTableData[i][iRequiredField]);
					}
				}

				sQuery = "PRAGMA index_list('" + sTableName + "')";
				this.selectQuery(sQuery);
				if(this.aTableData != null)
					aResult['numIndexes'] = this.aTableData.length;
				else
					aResult['numIndexes'] = 0;
				
				sQuery = "SELECT COUNT(*) FROM '" + sTableName + "'";
				this.selectQuery(sQuery);
				if(this.aTableData != null)
					aResult['numRecords'] = this.aTableData[0][0];
				else
					aResult['numRecords'] = 0;

        if(ciInfoType == -1)
        	return aResult;
				return aReturn;
    },
    
    // getIndexInfo : execute a pragma query and return the results
    getIndexInfo: function(sIndexName)
    {
    		//to find the table and sql of the index
				var sQuery = "SELECT sql, tbl_name FROM sqlite_master WHERE type='index' and name='" + sIndexName + "'";
//				alert(sQuery);
				this.selectQuery(sQuery);

				var aReturn = [];
				aReturn['sql'] = this.aTableData[0][0];
				aReturn['table'] = this.aTableData[0][1];

				//to find fields in the index
				var sQuery = "PRAGMA index_info('" + sIndexName + "')";
				this.selectQuery(sQuery);

       	var iRequiredField = 2;
				var cols = [];
				for(var i = 0; i < this.aTableData.length; i++)
				{
					cols.push(this.aTableData[i][iRequiredField]);
				}
				aReturn['cols'] = cols;

				//to find whether duplicates allowed
				aReturn['unique'] = 0;
				var sQuery = "PRAGMA index_list('" + aReturn['table'] + "')";
				this.selectQuery(sQuery);
				for(var i = 0; i < this.aTableData.length; i++)
				{
					if(this.aTableData[i][1] == sIndexName)
						aReturn['unique'] = this.aTableData[i][2];
				}
				
				//alert(aReturn.length);
				return aReturn;

    },
    
	select : function(file,sql,param)
	{
    if (this.storageService == null)
        this.Initialize();

		var ourTransaction = false;
		if (this.dataConnection.transactionInProgress)
		{
			ourTransaction = true;
			this.dataConnection.beginTransactionAs(this.dataConnection.TRANSACTION_DEFERRED);
		}
		var statement = this.dataConnection.createStatement(sql);
    if (param)
		{
			for (var m = 2, arg = null; arg = arguments[m]; m++) 
			{
				statement.bindUTF8StringParameter(m-2, arg);
			}
		}
		try
		{
			var dataset = [];
			while (statement.executeStep())
			{
				var row = [];
				for (var i = 0, k = statement.columnCount; i < k; i++)
				{
					row[statement.getColumnName(i)] = statement.getUTF8String(i);
				}
				dataset.push(row);
			}
			// return dataset;	
		}
		finally 
		{
			statement.reset();
		}
		if (ourTransaction)
		{
			this.dataConnection.commitTransaction();
		}
        return dataset;	
	},
	
	
	executeQuery: function(sQuery, param)
	{
    if (this.storageService == null)
        this.Initialize();

		var ourTransaction = false;
		if (this.dataConnection.transactionInProgress)
		{
			ourTransaction = true;
			this.dataConnection.beginTransactionAs(this.dataConnection.TRANSACTION_DEFERRED);
		}
		
    try 
		{
			// mozIStorageStatement
			var statement = this.dataConnection.createStatement(sQuery);
		}
		catch(e)
		{
			// statement will be undefined because it throws error);
			this.onSqlError(e, "Likely SQL syntax error: " + sQuery, 
							this.dataConnection.lastErrorString);
			return false;
		}

		if (param)
		{
			for (var m = 1, arg = null; arg = arguments[m]; m++) 
			{
				statement.bindUTF8StringParameter(m - 1, arg);
			}
		}
		try{
			statement.execute();
		}
		catch(e)
		{
			// statement will be undefined because it throws error);
			this.onSqlError(e, "Execute failed: " + sQuery, 
							this.dataConnection.lastErrorString);
			return false;
		}
		finally {
			statement.reset();
		}
		if (ourTransaction){
			this.dataConnection.commitTransaction();
		}
		return true;
	},	
/*	
	doSQL: function(thesql)
	{
		// if there is a problem with in the Select, Replace, Insert, Count, Delete  etc SQL statement 
		// if the table does not exist 
		// createStatement throws JS error.name == NS_ERROR_FAILURE, there is no return,the statement is undefined
		// theConn.lastErrorString contains the SQL Syntax error hint 
	
		// use the Step (Fetch a row at a time) method of using SQLite, so we keep track rows
		try
		{
	
				for (var i = 0; i < cols; i++)
				{
					this.resultsArray.push(statement.getString(i));
				}
	
				// executeStep to get the rest of the results a row at a time
	
				while (statement.executeStep())
				{
					myRows++;
					for (var i = 0; i < cols; i++)
					{
						this.resultsArray.push(statement.getString(i));
					}
				}
	
				addIt('tb2', " statement.numEntries " + statement.numEntries );  //? 
				addIt('tb2', " lastErrorString " + theConn.lastErrorString);
		}
		catch (e)
		{
				this.onSqlError(e, "Database Error ", theConn.lastErrorString );
		}
	
	// what about cleaning up these arrays?
	// the database is closed on html or xul page close 
	// I think this is safe to reset here, if we do not get here, we are probably too hosed to do anything anyways
	
	statement.reset;
	return true;
	},
	
*/	
	onSqlError: function(ex, msg, SQLmsg)
	{
		try
		{
			this.sExceptionName = ex.name;
			this.sExceptionMessage = ex.message;
			this.sErrorMessage = msg;
			if (SQLmsg != null)
				this.sErrorMessage += " [ " + SQLmsg + " ]";
		}
		catch(error)
		{
			alert("Component Error " + msg + "  1: " + ex.name + 
						"  2: " + ex.message);
		}
		alert(this.sErrorMessage + "\n" +
		      "Exception Name: " + this.sExceptionName + "\n" +
					"Exception Message: " + this.sExceptionMessage);
		return;
	}
};

