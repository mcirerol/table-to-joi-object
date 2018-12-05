const joiVarName = 'bsaJoi';
const bsaRulesVarName = 'rules';
function normalizeColumnName(columnName) {
    let columnNameFirstLowerCase = columnName.replace(/^([A-Z])(.*)/, (...args) => `${args[1].toLowerCase()}${args[2]}`);
    const especialWords = 'GUID|ID|PK|SK|DT|BY';
    columnNameFirstLowerCase = columnNameFirstLowerCase.replace(new RegExp(`^(${especialWords})(.*)`, 'i'), (...args) => `${args[1].toLowerCase()}${args[2]}`);
    console.log(columnNameFirstLowerCase);

    return columnNameFirstLowerCase.replace(new RegExp(especialWords, 'g'), (match) => `${match.charAt(0)}${match.substring(1).toLowerCase()}`);
}
function getStringJoiSentence(joiDefinition) {
    const methods = [];
    methods.push(joiDefinition.joiBase);
    methods.push(...joiDefinition.joiRules);
    return `${joiVarName}.${methods.join('.')}`;
}

function completeMissingMatches(match, joiDefinition) {
    const missingRules = joiDefinition.joiRules.filter(rule => !match.matchedRules.includes(rule));
    if (missingRules.length > 0) {
        return `${bsaRulesVarName}.${match.bsaRule.property}.${missingRules.join('.')}`;
    }
    return `${bsaRulesVarName}.${match.bsaRule.property}`;
}

function completeBsaRules({ match, joiDefinition }) {
    if (match == null) {
        return { sentence: getStringJoiSentence(joiDefinition), property: normalizeColumnName(joiDefinition.name) };
    }
    return { sentence: completeMissingMatches(match, joiDefinition), property: normalizeColumnName(joiDefinition.name) };
}

function formatSchema(update, insert, tableName){
    const values = [];
    if(update){
        values.push(`putPayload: ${update}`);
    }
    if(insert){
        values.push(`postPayload: ${insert}`);
    }
    const objectDeclaration = 
`const ${normalizeColumnName(tableName)}Schema = {
    ${values.join('\n    ')}
};`;
    return objectDeclaration;
  }
  
  function formatSchemaInsert(values){
    const valuePropertyStrings = values.map(value => `${value.property}: ${value.sentence},`);
    const objectDeclaration = 
  `{
        ${valuePropertyStrings.join('\n        ')}
  },`;
    return objectDeclaration;
  }
  
  function formatObjectUpdate(values){
    const valuePropertyStrings = values.map(value => `${value.property}: ${value.sentence},`);
    const objectDeclaration = 
  `${joiVarName}.object({
        ${valuePropertyStrings.join('\n        ')}
  }).min(1),`;
    return objectDeclaration;
  }

  module.exports = { formatObjectUpdate, formatSchemaInsert, formatSchema, completeBsaRules };