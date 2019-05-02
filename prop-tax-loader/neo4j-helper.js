// helper methods.

"use strict";

const neo4j = require("neo4j-driver").v1;
const util = require("util");
const settings = require("./config.js")();
const jUtils = require("./json-utils.js");
const schema = require("./pt-schema.js");

const uri = settings.boltUri;
const user = "neo4j", pass = "pavi4j";
const driver = neo4j.driver(uri, neo4j.auth.basic(user, pass));
const session = driver.session();

var fns = {
  // inserts a node 
  insertNode: function(label, props) {
    let alias = getAlias(label);
    let data = jUtils.inspect(jUtils.removeUndefined(props));
    let cmd = `CREATE (${label} ${data} )`;
    return {alias:alias, cmd:cmd};
  },

  /* 
   * label, key, data.
   * If a node with property = key exists, it won't be 
   * created, but extra props will be added to that node.
   */
  upsertNode: function(label, keys,  props) {
    let alias = getAlias(label);
    let filter = createSearchFilter(keys, props);
    let mergeCmd = `MERGE (${label} ${filter})`
                    + setPropsFromObject(props, alias)
    return {alias:alias, cmd:mergeCmd};
  },


  /*
   * Another version of upsert that takes 
   * creation props and match props.  That is, 
   * if a new node was created, then 
   *    the createProps would be used, 
   * else if it was a mathing node, 
   *    matchProps would be used.
   */
  upsertNodeEx : function(label, keys, createProps, matchProps) {

    let alias = getAlias(label);
    let filter = createSearchFilter(keys, createProps);

    let mergeCmd = `MERGE (${label} ${filter})`;
    if (createProps !== undefined && !jUtils.isEmpty(createProps))
        mergeCmd += '\n ON CREATE ' + setPropsFromObject(createProps, alias);

    if (matchProps !== undefined && !jUtils.isEmpty(matchProps))
        mergeCmd += "\n ON MATCH " + setPropsFromObject(matchProps, alias);

    return {alias:alias, cmd:mergeCmd};
  },

  // Updates a node 
  updateNode: function(node) { },

  addPipe: function(key, alias) {
    return {cmd:`WITH ${key} as ${alias}`};
  },

  /**
   * Finds a matching node based on a key
   * @param label {string} -- The node's label within which to search.
   * @param filter {JSONObject} -- a filter object containing key:value pairs to search
   * @return obj {JSONObject} -- a json containing the cmd that accomplishes the search.
   **/
  findNode: function(label, filter) {
    let filterProps = getFilterProps(filter);
    let cmd = `MATCH (${label} ${filterProps})`
    let alias = getAlias(label);
    return {alias:alias, cmd:cmd};
  },

  add2Set: function(cmdSet, cmd) {
    cmdSet.push(cmd);
    return cmdSet;
  },

  /**
   * Sets a relation between two node entities.
   **/
  setRelation: function(source, target, rel, props) {
    if (props) {
      props = util.inspect(props);
    } else { props = "" }
    return {
      alias: getAlias(rel),
      cmd:`MERGE (${source.alias})-[:${rel} ${props}]->(${target.alias})`
    }
  },

  exec: async function(cmdSet) {
    // join all commands by newline.
    let command = "";
    cmdSet.forEach((obj) => {
       command += obj.cmd + "\n";
    });
    console.log("Command:", command);
    debugger;
    return session.run(command);
  },

  close: function() {
    session.close();
    driver.close();
  }
};

module.exports = fns;

//////////////////////////////////////////////////////////////////////
// 
//////////////////////////////////////////////////////////////////////
function setPropsFromObject(obj, alias) {

  // if obj is empty or undefined, return empty.
  if (obj === undefined || jUtils.isEmpty(obj)) return "";

  let keys = Object.keys(obj);
  let propString = "";
  keys.map((key, index) => {
    if (index >0) propString += ", " ;  // after first, we need commas.
    //propString += " " + alias + "." + key + "=\"" + escapeQuotes(obj[key]) + "\"";

    let val = escapeQuotes(obj[key]);
    if (schema[key] == "string") {
      propString += " " + alias + "." + key + "=\"" + val + "\"";
    } else {
      propString += " " + alias + "." + key + "=" + val;
    }
  })
  return ` SET ${propString}`;

}

function getAlias(label) {
  let pos = label.indexOf(":");
  return pos==-1?"":label.substring(0,pos);
}

/* escapes (i.e. adds backslash "\") to quotes and backslash chars */
function escapeQuotes(instr) {
  // if the type is not a string, just return the input as it is.
  if (typeof(instr) !== "string") return instr;

  // escape double quotes
  let out = instr.replace(/"/g, '%22');
  // escape backslashes
  out = out.replace(/\\/g, '\\\\');
  return out;
}


// we rollout our own version of stringification
// of object props, because util.inspect or json.stringify
// are not returning output as needed for the neo4j
function getFilterProps(obj) {
  let keys = Object.keys(obj);
  let out = "{";
  for (var i=0; i<keys.length; i++) {
    if (i>0) out += ", ";
    out += keys[i] + ":" + '"' + obj[keys[i]] + '"'
  }
  out += "}"
  return out;
}


function createSearchFilter(keys, props) {
  let filter = "";
  keys.map((key, index) => {
    if (index >0) filter += ", ";
    let keyval = props[key];
    //if (typeof(keyval)==="string") keyval = '"' + escapeQuotes(props[key]) + '"';
    if (schema[key] == "string") keyval = '"' + escapeQuotes(props[key]) + '"';
    filter += key + ":" + keyval;
  });
 
  // if there were any items in the filter list,
  // add the braces, else return empty.
  if (filter.length >0) filter = "{" + filter + "}";
  return filter;
}

function toNumberString (num) {
  return `"${num}"`;
}

