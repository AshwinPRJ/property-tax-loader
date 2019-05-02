// 
// Checks if the address is missing in the input data.
// If yes, creates a relation to missing-address node.
//

const db = require("../neo4j-helper.js");
const ruleName = "MissingArea";
const ruleNode = "missingArea:Issue:MissingArea";
const relation = "MISSING_AREA";

const areaRule = {

  exec: function(propNode, propData) {
    // check, if address is missing, if yes emit a 
    // relation to missing-address issue type,
    // which should be linked to this property.
    if (propData.area === undefined || propData.area === "") {
      console.warn("Missing areas for pid:", propData.pid);
      let issueNode = db.upsertNode(ruleNode, ['name'], {name:ruleName});
      let rel = db.setRelation(propNode, issueNode, relation);
      return [issueNode, rel];
    } else {
      return [];
    }
  }

};

module.exports = areaRule;


