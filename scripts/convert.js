// Testing

console.log('\n\n\n')

console.log('******************************')

console.log('**** DECOMM78 Team (SWAT) ****')

console.log('******************************')

console.log('\n\n\n')

// Global variables needed for processing

// Sour File Name

var g_strSourceFileName = 'landids.sql'

// Source file location (file name should be database + _prod_parse.sql, example db name is today, today_prod_parse.sql)

var g_strSourceFileLocation = 'C:\\TestPull\\'

// Destination file location

var g_strDestinationFileLocation = 'C:\\TestPull\\'

// DB name

var g_strDBName = 'hurr2005'

// Table name, cause at times we need it

var g_strTableName = ''

// Ok, need file name too

var g_strUNLFile = ''

// Flag all fields to be not null

var g_bNotNull = true

// Procedure creation flag

var g_bProcedureProcess = false

// Table creation flag

var g_bTableProcess = false

// Index creation flag

var g_bIndexProcess = false

// Unique Index creation flag

var g_bUniqueIndexProcess = false

// Constraints

var g_bConstraintsProcess = false

// Dynamic SQL container

var g_strBulkInsert = ''

// Flag for adding bulk insert statement at end

var g_bBulkInsert = false

// House keeping variables

var strResult = ''

var astrLines = ''

var strTempHold = ''

var strIndex = ''

var strNullFields = ''

var strParse = ''

var intComma = 0

var strTable = ''

var strProcedure = ''

g_strBulkInsert = 'DECLARE @vchPath AS VARCHAR(500) \nDECLARE @vchSQLCommand As VARCHAR(MAX) \nDECLARE @vchDataBase AS VARCHAR(50) \n\n\n-- Variables we set at runtime \n'

g_strBulkInsert += "SET @vchPath = '\\\\Armmokcp3db27dv\\etl\\DECOM78\\'\nSET @vchDataBase = 'REPLACE'\n\n"

var jsonExclusions = ''

var jsonAlerts = ''

var jsonRemoveLine;

// Create json objects for use

// First beginw ith the table json object

var jsonTables;

function func_ReplaceValues (p_strLine, l_jsonTables) {
  l_strTemp = ''

  var l_objJS = JSON.parse(jsonTables)

  l_strTemp = p_strLine

  for (var item in l_objJS) {
    if (l_objJS.hasOwnProperty(item)) {
      switch (l_objJS[item].type) {
        case 'replace':

          l_strTemp = l_strTemp.replace(l_objJS[item].key, l_objJS[item].value)

          break

        default:

          break

      }
    }
  }

  return l_strTemp
}

function func_ParseInformixTables (p_strLine) {

  // Set some local variables to the function

  var l_objJS = JSON.parse(jsonTables)

  var l_objRemove = JSON.parse(jsonRemoveLine)

  var l_bRemove = false

  var l_strResult = ''

  var l_strTemp = ''

  // First, all lines get cleared of doublequotes

  p_strLine = p_strLine.replace(/"/g, '', '')

  if (p_strLine.indexOf('{ TABLE informix.') != -1) {

    // Ok, we have the informix script putting the database table in there

    g_strTableName = p_strLine.substr(p_strLine.indexOf('{ TABLE informix.') + 17, p_strLine.indexOf('row size') - (p_strLine.indexOf('{ TABLE informix.') + 17)).trim()

    // g_strBulkInsert = "SET @vchSQLCommand = 'BULK INSERT ' + @vchDataBase + '.dbo.producer FROM ''' + @vchPath + 'produ00103.unl'' WITH (FIELDTERMINATOR =''|'', ROWTERMINATOR = ''0x0a'');'"

    // console.log(g_strBulkInsert)

  }

  // We have a file, lets us it, and then flag we need to add to the end of the script

  if (p_strLine.indexOf('{ unload file name') != -1) {
    g_bBulkInsert = true

    g_strUNLFile = p_strLine.substr(p_strLine.indexOf('{ unload file name') + 21, p_strLine.indexOf('number of rows') - (p_strLine.indexOf('{ unload file name') + 21)).trim()

    g_strBulkInsert += "SET @vchSQLCommand = 'BULK INSERT ' + @vchDataBase + '.dbo." + g_strTableName + " FROM ''' + @vchPath + '" + g_strUNLFile + "'' WITH (FIELDTERMINATOR =''|'', ROWTERMINATOR = ''d78_jdw_rfh'');'"

    g_strBulkInsert += '\n\nPRINT @vchSQLCommand\n\nEXEC(@vchSQLCommand)\n\n\n'
  }

  // Process removal of excluded lines

  for (var iRemove in l_objRemove) {
    if (l_objRemove.hasOwnProperty(iRemove)) {
      if (p_strLine.indexOf(l_objRemove[iRemove].value) != -1) {

        // console.log(p_strLine)

        l_bRemove = true
      }
    }
  }

  // Now do we proess the line?

  if (l_bRemove == false) {

    // determine it is a table, or end of table

    if (p_strLine.indexOf('create table') != -1 && g_bTableProcess == false) {

      // Need to get table name here

      strTable = p_strLine.substr(p_strLine.indexOf('.') + 1, 100).trim()

      l_strResult += 'CREATE TABLE ' + strTable + '\n'

      l_strResult += '( \n'

      g_bTableProcess = true
    } else {
      if (g_bTableProcess == true) {
        if (p_strLine.indexOf(') extent size') != -1) {
          l_strResult += ')--eot \n\n'

          g_bTableProcess = false
        } else {
          if (p_strLine.indexOf(');') != -1) {
            l_strResult += ')--eot \n\n'

            g_bTableProcess = false
          }
        }
      }
    }

    // Indexes go here, we need to get it right

    if (g_bTableProcess == false && p_strLine.indexOf('create index') != -1 && g_bIndexProcess == false && g_bUniqueIndexProcess == false && g_bConstraintsProcess == false) {

      // Ok, we have indexes to process

      g_bIndexProcess = true
    }

    // Ok, on the we need to do some work, on just a regular index

    if (g_bTableProcess == false && g_bIndexProcess == true && g_bUniqueIndexProcess == false && g_bConstraintsProcess == false) {
      l_strTemp = p_strLine

      l_strTemp = func_ReplaceValues(l_strTemp, jsonTables)

      if (l_strTemp.indexOf(';') != -1) {
        l_strTemp = l_strTemp + '\n GO \n'

        g_bIndexProcess = false
      }

      l_strResult = l_strTemp + '\n'
    }

    // Ok, unique indexes

    // Indexes go here, we need to get it right

    if (g_bTableProcess == false && p_strLine.indexOf('create unique index') != -1 && g_bIndexProcess == false && g_bUniqueIndexProcess == false && g_bConstraintsProcess == false) {

      // Ok, we have indexes to process

      g_bUniqueIndexProcess = true
    }

    // Ok, on the we need to do some work, on just a regular index

    if (g_bTableProcess == false && g_bIndexProcess == false && g_bUniqueIndexProcess == true && g_bConstraintsProcess == false) {
      l_strTemp = p_strLine

      l_strTemp = func_ReplaceValues(l_strTemp, jsonTables)

      if (l_strTemp.indexOf(';') != -1) {
        l_strTemp = l_strTemp + '\n GO \n'

        g_bUniqueIndexProcess = false
      }

      l_strResult = l_strTemp + '\n'
    }

    if (g_bTableProcess == false && p_strLine.indexOf('create unique cluster index') != -1 && g_bIndexProcess == false && g_bUniqueIndexProcess == false && g_bConstraintsProcess == false) {

      // Ok, we have indexes to process

      g_bUniqueIndexProcess = true
    }

    // Ok, on the we need to do some work, on just a regular index

    if (g_bTableProcess == false && g_bIndexProcess == false && g_bUniqueIndexProcess == true && g_bConstraintsProcess == false) {
      l_strTemp = p_strLine

      l_strTemp = func_ReplaceValues(l_strTemp, jsonTables)

      if (l_strTemp.indexOf(';') != -1) {
        l_strTemp = l_strTemp + '\n GO \n'

        g_bUniqueIndexProcess = false
      }

      l_strResult = l_strTemp + '\n'
    }

    // Constraints

    if (g_bTableProcess == false && p_strLine.indexOf('add constraint') != -1 && g_bIndexProcess == false && g_bUniqueIndexProcess == false && g_bConstraintsProcess == false) {

      // Ok, we have indexes to process

      g_bConstraintsProcess = true
    }

    // Ok, on the we need to do some work, on just a regular index

    if (g_bTableProcess == false && g_bIndexProcess == false && g_bUniqueIndexProcess == false && g_bConstraintsProcess == true) {
      l_strTemp = p_strLine

      // Get table name for later use in constraint naming

      if (l_strTemp.indexOf('constraint primary') != -1) {
        l_strTableName = 'CN_PK_' + l_strTemp.substr(l_strTemp.indexOf('alter table') + 12, l_strTemp.indexOf('add constraint') - 12).trim().replace('informix.', '') + '_' + Math.floor(Math.random() * 100).toString()

        l_strTemp = l_strTemp.replace('add constraint ', 'add constraint ' + l_strTableName + ' ')
      }

      if (l_strTemp.indexOf('foreign key') != -1) {
        l_strTableName = 'CN_FK_' + l_strTemp.substr(l_strTemp.indexOf('alter table') + 12, l_strTemp.indexOf('add constraint') - 12).trim().replace('informix.', '') + '_' + Math.floor(Math.random() * 100).toString()

        l_strTemp = l_strTemp.replace('add constraint ', 'add constraint ' + l_strTableName + ' ')

        l_strTemp = l_strTemp.replace('(foreign key', 'foreign key')
      }

      if (l_strTemp.indexOf(');') != -1) {
        l_strTemp = l_strTemp.replace(');', ';')
      }

      l_strTemp = func_ReplaceValues(l_strTemp, jsonTables)

      if (l_strTemp.indexOf(';') != -1) {
        l_strTemp = l_strTemp + '\n GO \n'

        g_bConstraintsProcess = false
      }

      l_strResult = l_strTemp + '\n'
    }

    // Ok, time for procedure work

    if (g_bProcedureProcess == false && p_strLine.indexOf('create dba procedure') != -1 && g_bIndexProcess == false && g_bUniqueIndexProcess == false && g_bConstraintsProcess == false && g_bTableProcess == false) {

      // Ok, we have indexes to process

      g_bProcedureProcess = true
    }

    if (g_bProcedureProcess == true && g_bIndexProcess == false && g_bUniqueIndexProcess == false && g_bConstraintsProcess == false && g_bTableProcess == false) {

      // Ok, we have procedures to process

    }

    // If we are creating at table, then do some work

    if (g_bTableProcess == true && p_strLine.indexOf('create table') == -1 && !(p_strLine.indexOf('(') > 0 && p_strLine.indexOf('(') < 5) && !(p_strLine.indexOf('primary key (') > 0)) {
      l_strTemp = p_strLine

      l_strTemp = func_ReplaceValues(l_strTemp, jsonTables)

      l_strResult += l_strTemp + '\n'
    }
  } else {
    l_bRemove = false
  }

  return l_strResult
}

// Function to be called to process file

function func_ProcessFile (p_strSourceFile) {
  var l_objFS = require('fs')

  var l_strReturn = ''

  try {
    l_strReturn = l_objFS.readFileSync(p_strSourceFile, 'utf8')

    // console.log(data); 

  } catch(e) {
    l_strReturn = 'Error:', e.stack
  }

  return l_strReturn
}

function func_BeginProcess (p_strfile) {
  var l_strResult = ''

  astrLines = func_ProcessFile(p_strfile).split('\n')

  // Time to parse and build the table T-SQL script

  for (var i = 0;i < astrLines.length;i++) {
    strTempHold = func_ParseInformixTables(astrLines[i].toString())

    // strParse = strTempHold

    // Now we need to add in a check for the last of a table in the create statement

    if (strTempHold.indexOf(')--eot') != -1) {
      intComma = l_strResult.lastIndexOf(',')

      if ((l_strResult.length - intComma) < 2) {
        l_strResult = l_strResult.substr(0, intComma) + '' + '\n'
      }

      strTempHold = strTempHold.replace('--eot', '')

      if (strNullFields != '') {
        strTempHold += strNullFields

        strNullFields = ''
      }
    }

    if (strTempHold.indexOf(' constraint ') != -1 && strTempHold.indexOf(' add constraint ') == -1) {
      var l_strNewConstraint = strTempHold.substring(strTempHold.indexOf('constraint ') + 11, strTempHold.indexOf(';')).replace(';', '').trim()

      var l_strOldConstraint = l_strResult.substring(l_strResult.lastIndexOf('add constraint') + 14, l_strResult.lastIndexOf('primary')).trim()

      l_strResult = l_strResult.replace(l_strOldConstraint, l_strNewConstraint)

      strTempHold = strTempHold.replace('constraint', '')

      strTempHold = strTempHold.replace(l_strNewConstraint, '')
    }

    l_strResult += strTempHold

    strParse += l_strResult
  }

  if (g_bBulkInsert == true) {
    l_strResult += g_strBulkInsert
  }

  return l_strResult
}

// strParse = func_BeginProcess(g_strSourceFileLocation + g_strSourceFileName)

console.log(func_BeginProcess(g_strSourceFileLocation + g_strSourceFileName))
