"use script";

const config = require("./config.js")();
const xlsx = require("node-xlsx");
const path = require("path");
const db = require("./neo4j-helper");
const BPromise = require("bluebird");

debugger;
const worksheets = xlsx.parse(path.resolve(config.propTypesFile));
let worksheetIndex = process.argv[2] || 0;
let rowStart = process.argv[3] || 7;
worksheets[worksheetIndex].data.splice(0, rowStart);

data = worksheets[worksheetIndex].data;
BPromise.reduce(data, addpPropType, {})
			  .then( () => {
			    db.close();
			    console.log ("All done.");
			  });

var cTypes = {
	"CONSTRUCTED" : 0,
	"OPEN LAND"   : 1,
}

var uTypes = {
  "UNDEFINED" 										 : 0,
	"COMMERCIAL" 										 : 1, 
  "RESIDENTIAL"										 : 2,
  "RESI/COMM"											 : 3,
  "PUBLIC SERVICE" 								 : 4,
	"Government Institution"				 : 5,
	"INDUSTRIAL" 										 : 6,
	"Mosque(Masjid)"								 : 7,
  "Temple"												 : 8,
  "VACANT SITE" 									 : 9,
}


/*
	adds types to properties.
*/
async function addpPropType(acc, row, index) {

debugger;

	// for given property, perform merge operation
	console.log("Inserting record ",index);	
  let propInfo = {
      pid: row[1],
      c_type: cTypes[row[4]],
      u_type: uTypes[row[5]],
  };
  let propInfoF = Object.assign({fromTypes:1}, propInfo);

  let commandSet = [];
  var propNode = db.upsertNodeEx("p:Property", ["pid"], propInfoF, propInfo);
  var wardNode = db.upsertNodeEx("w:Ward", ['name'], {name: row[0]});
  commandSet.push(propNode); 
  commandSet.push(wardNode); 
  commandSet.push(db.setRelation(propNode, wardNode, "LOCATED_IN"))
	let result = await db.exec(commandSet);
}

