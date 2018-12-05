
const bsaRules = require('./bsa-rules');
const { splitHighOrder } = require('./split-high-order');
const { getJoiRulesFromColumnDefinition, processSqlTableDeclaration } = require('./parsers');
const { formatObjectUpdate, formatSchemaInsert, formatSchema, completeBsaRules } = require('./formatters');
const { getMatchs } = require('./bsa-rules-match');


function getJoiStringObject(content, update) {
  const rules = bsaRules;
  const properties = splitHighOrder(content, /,/);
  const result = properties.map(getJoiRulesFromColumnDefinition.bind(null, update)).filter(value => value != null);
  const bsaRulesMatchs = getMatchs(result, rules);

  const finalResult = bsaRulesMatchs.map(completeBsaRules);
  if(update){
    return formatObjectUpdate(finalResult);
  }

  return formatSchemaInsert(finalResult);
  
}

function getCompleteJoiObject(option, tableDeclaration){
  const { content, tableName } = processSqlTableDeclaration(tableDeclaration);
  if(option === 'update'){
    const updateObject = getJoiStringObject(content, true);
    return formatSchema(updateObject, null, tableName);
  }
  if(option === 'insert'){
    const insertObject = getJoiStringObject(content, false);
    return formatSchema(null, insertObject, tableName);
  }
  if(option === 'both'){
    const updateObject = getJoiStringObject(content, true);
    const insertObject = getJoiStringObject(content, false);
    return formatSchema(updateObject, insertObject, tableName);
  }
}

module.exports = getCompleteJoiObject;