/**
 * Prints the contents of an excel cell.
 **/

 const xlsx = require("node-xlsx");
 const path = require("path");

 const excelFile = process.argv[2];
 const row = process.argv[3];
 const col = process.argv[4];

if (excelFile===undefined || row===undefined || col===undefined) {
  console.log("usage: node print-cell.js excelfile address");
  process.exit(1);
}

//const index = getRowCols(address);

// open the file.
const worksheets = xlsx.parse(path.resolve(excelFile));

debugger;
const data = worksheets[0].data[row][col]
console.log("data:");
console.log(data);



function getRowCols(addr) {
  
}
