// 
// Checks if the address is missing in the input data.
// If yes, creates a relation to missing-address node.
//

const db = require("../neo4j-helper.js");
const ruleName = "MissingAddress";
const ruleNode = "missingAddr:Issue:MissingAddress"
const relation = "MISSING_ADDRESS";

const addressRule = {

  exec: function(propNode, propData, ownerNode, ownerData) {
    // check, if address is missing, if yes emit a 
    // relation to missing-address issue type,
    // which should be linked to this property.
    if (propData.address === undefined || propData.address === "") {
      console.warn("Missing address for pid:", propData.pid);
      let issueNode = db.upsertNode(ruleNode, ['name'], {name: ruleName});
      let rel = db.setRelation(propNode, issueNode, relation);
      return [issueNode, rel];
    } else {
      return [];
    }
  }

};

module.exports = addressRule;

