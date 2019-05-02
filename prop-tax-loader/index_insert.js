/**
 * Loads master property data (pid, owner, address, ward, ...) to graph database.
 **/

"use script";

const config = require("./config.js");
const xlsx = require("node-xlsx");
const path = require("path");
const BPromise = require("bluebird");
const ruleChain = require("./rules/index.js");
const db = require("./neo4j-helper");

const rowStartIndex = process.argv[2] || 0;
const rows = process.argv[3] ;
console.log("Processing from row:", rowStartIndex, "...");

debugger;

// Load the file
const worksheets = xlsx.parse(path.resolve(config.ownersFile));
worksheets[0].data.splice(0, rowStartIndex);
if (rows) 
  data = worksheets[0].data.splice(0, rows);
else 
  data = worksheets[0].data;


debugger;
BPromise.reduce(data, add2Graph, {}).then(() => {
  db.close ();
  console.log("All done.");
})


async function add2Graph(acc, row, index) {

  console.log("Adding row #%d...", index)
  let commandSet = [];
  let propData = getPropData(row);
  let propNode = db.insertNode('p:Property', propData);
  commandSet.push(propNode);

  // nodes creation...
  let ownerData = getOwnerData(row);
  let ownerNode = db.insertNode('person:Person', ownerData);
  commandSet.push(ownerNode);

  let yearData = getYear(row);
  let year = db.upsertNode('y:Year', ['name'], yearData);
  commandSet.push(year)

  let wardData = getWard(row);
  let ward = db.upsertNode('w:Ward', ['name'], wardData);
  commandSet.push(ward);

  // relations between the nodes.
  commandSet.push(db.setRelation(propNode, ownerNode, "OWNED_BY"));
  commandSet.push(db.setRelation(propNode, ward, "LOCATED_IN"));
  commandSet.push(db.setRelation(propNode, year, "ASSESSMENT_YR"));

  // create issue list for this property.
  //commandSet.push(ruleChain(propNode, propData, ownerNode, ownerData));
  commandSet = commandSet.concat(ruleChain(propNode, propData, ownerNode, ownerData));
  

debugger;
  let result = await db.exec(commandSet);

  return acc;
}


function getPropData(row) {

  let data = {};
  if(row[0]!== undefined) data.pid= '"' + row[0] + '"';
  if(row[1]!== undefined) data.old_sas= '"' + row[1] + '"';
  if(row[2]!== undefined) data.new_sas= '"' + row[2] + '"';
  //if(row[3]!== undefined) data.name_KA=row[3];
  //if(row[4]!== undefined) data.midde_name_KA=row[4];
  //if(row[5]!== undefined) data.name=row[5];
  //if(row[6]!== undefined) data.middle_name=row[6];
  if(row[7]!== undefined) data.address= row[7];
  if(row[8]!== undefined) data.assessment_year=row[8];
  if(row[9]!== undefined) data.ward=row[9];
  return data;
}

function getOwnerData(row) {
  return {
    name_KA:        row[3],
    middle_name_KA: row[4],
    name:           row[5],
    middle_name:    row[6] 
    //address:        '"' + row[7] + '"'
  };
}

function getWard(row) {
  return {name: row[9]};
}

function getYear(row) {
  return {name: row[8]};
}

