(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const tableToJoi = require('./table-to-joi');

function process() {
  try {
    const tableDeclaration = document.getElementById('tableDeclaration').value;
    const option = document.getElementById('optionObject').value;
    const result = tableToJoi(option, tableDeclaration);
    document.getElementById('result').value = result;
  } catch (error) {
    console.error(error);
    alert(`An error ocurred, make sure its a valid table declation`);
  }


}

function test(){
  const tableDeclaration = `
  CREATE TABLE AKELA_OLR.dbo.Applicant (
    EmailAddress varchar(255)
  ) go
  `;
  const result = tableToJoi('both', tableDeclaration);
  console.log(result);
}


// test();
document.addEventListener("DOMContentLoaded", function (event) {
  document.getElementById('processButton').onclick = process;
  document.getElementById('form').onsubmit = process;
});


},{"./table-to-joi":5}],2:[function(require,module,exports){
const requiredJoiRules = {
  'required()': true,
  'integer()': true,
  'guid()': true,
}

const specificRulesByColumnNamesMatches = [/zip(code)?5/i, /zip(code)?4/i, /email/i, /phoneAreacode/i, /phonePrefix/i, /phoneLineNumber/i, /phoneExtension/i];

function columnNameMatchesSpecificRule(columnName) {
  return specificRulesByColumnNamesMatches.find(regexRule => regexRule.test(columnName));
}

function getBsaRulesByRegex(regex, bsaRules) {
  return bsaRules.filter(rule => regex.test(rule.property))
}

function isValidRule(bsaRule, joiDefinition, allowedRulesToHaveExtra) {
  const requiredToMatch = joiDefinition.joiRules.filter(rule => requiredJoiRules[rule]);
  const allRequiredPresent = requiredToMatch.every(ruleRequired => bsaRule.rules.includes(ruleRequired));
  const allCommon = bsaRule.rules.every(rule => {
    if (requiredToMatch.includes(rule)) {
      return true;
    }
    const [, ruleName] = /^([^]+)\(.*$/.exec(rule);
    if (allowedRulesToHaveExtra.includes(ruleName)) {
      return true;
    }
    if (joiDefinition.joiRules.includes(rule)) {
      return true;
    }
    return false;
  });
  return allCommon && allRequiredPresent;
}

function getMatchRules(joiDefinition, bsaRule) {
  const joiRulesMatched = joiDefinition.joiRules.filter(rule => bsaRule.rules.includes(rule));
  return joiRulesMatched;
}



function rulesMatch(bsaRule, joiDefinition) {
  const common = ['valid', 'invalid', 'allow', 'disallow', 'min', 'max', 'format', 'raw'];
  const requiredToMatch = joiDefinition.joiRules.filter(rule => requiredJoiRules[rule]);
  const allRequiredPresent = requiredToMatch.every(ruleRequired => bsaRule.rules.includes(ruleRequired));
  const allCommon = bsaRule.rules.every(rule => {
    if (requiredToMatch.includes(rule)) {
      return true;
    }
    const [, ruleName] = /^([^]+)\(.*$/.exec(rule);
    if (common.includes(ruleName)) {
      return true;
    }
    if (joiDefinition.joiRules.includes(rule)) {
      return true;
    }
    return false;
  });
  return allCommon && allRequiredPresent;
}

function match(joiDefinition, bsaRule) {
  console.log(bsaRule.base, ' versus ', joiDefinition.joiBase);
  const allowedRulesToHaveExtra = ['valid', 'invalid', 'allow', 'disallow', 'min', 'max', 'format', 'raw'];
  if (bsaRule.base === joiDefinition.joiBase && isValidRule(bsaRule, joiDefinition, allowedRulesToHaveExtra)) {
    const match = {};
    match.matchedRules = getMatchRules(joiDefinition, bsaRule);
    match.bsaRule = bsaRule;
    return match;
  } else return null;
}


function getBestMatch(joiDefinition, matches) {
  return matches.reduce((bestMatch, match) => {
    if (match.matchedRules.length > bestMatch.matchedRules.length) {
      return match;
    }
    if (match.matchedRules.length === bestMatch.matchedRules.length) {
      if (match.bsaRule.rules.length > bestMatch.bsaRule.rules.length) {
        return match;
      }
      return bestMatch;
    }
    return bestMatch;
  }, matches[0])
}

function getMatchesByName(joiDefinition, bsaRules) {
  const regexFound = columnNameMatchesSpecificRule(joiDefinition.name)
  if (regexFound != null) {
    const matchedRules = getBsaRulesByRegex(regexFound, bsaRules);
    const allowedRulesToHaveExtra = ['valid', 'invalid', 'allow', 'disallow', 'min', 'max', 'format', 'raw', 'regex', 'length', 'options', 'email'];
    return matchedRules.filter((matchedRule) => isValidRule(matchedRule, joiDefinition, allowedRulesToHaveExtra)).map((bsaRule)=>{
      const match = {};
      match.matchedRules = joiDefinition.joiRules.slice(0);
      const includesRequired = bsaRule.rules.includes('required()');
      const includesAllowNull = bsaRule.rules.includes('allow(null)');
      match.matchedRules = match.matchedRules.filter((rule) =>{
        if(!includesRequired && rule === 'required()'){
          return false;
        }
        if(!includesAllowNull && rule === 'allow(null)'){
          return false;
        }
        return true;
      })
      match.bsaRule = bsaRule;
      return match;
    })
  }
}

function getbsaRuleMatches(joiDefinition, bsaRules) {
  const matchesByName = getMatchesByName(joiDefinition, bsaRules)
  if (matchesByName != null && matchesByName.length > 0) {
    return matchesByName;
  }
  const matches = [];
  for (let i = 0; i < bsaRules.length; i++) {
    const matchResult = match(joiDefinition, bsaRules[i]);
    if (matchResult != null) {
      matches.push(matchResult);
    }
  }
  return matches;
}

function getMatchs(joiDefinitions, rules) {
  const matchedRules = joiDefinitions.map(joiDefinition => getbsaRuleMatches(joiDefinition, rules));
  const bsaRulesMatchs = matchedRules.map((matches, index) => {
    const match = getBestMatch(null, matches);
    const joiDefinition = joiDefinitions[index];
    return { match, joiDefinition };
  })
  return bsaRulesMatchs;
}

module.exports = { getMatchs };
},{}],3:[function(require,module,exports){
const { splitHighOrder } = require('./split-high-order');
const bsaRules =
  `
  const rules = Joi => ({
    //
    // Validate a person GUID,NO Required
    //
    guid: Joi.string().guid(),
  
    //
    // Validate a person GUID, Required
    //
    guidRequired: Joi.string().guid().required(),
  
    //
    // Validate an id: Numeric, integer, min 1, max 2147483647
    //
    id: Joi.number().integer().min(1).max(NUMBER_TYPES.INT),
  
    //
    // Validate an userId: Numeric, integer, min 1, required, convert to string
    //
    idRequired: Joi.number().integer().min(1).max(NUMBER_TYPES.INT)
      .required(),
  
    //
    // Validate date: date, format YYYY-MM-DD
    //
    date: Joi.date().format('YYYY-MM-DD').raw(),
  
    //
    // Validate date: date, format YYYY-MM-DD not empty
    //
    dateNotEmpty: Joi.date().format('YYYY-MM-DD').raw().invalid('')
      .options({
        language: {
          date: {
            base: 'must be a string with one of the following formats [YYYY-MM-DD]',
          },
        },
      }),
  
    //
    // Validate date: date, format YYYY-MM-DD, required
    //
    dateRequired: Joi.date().format('YYYY-MM-DD').raw()
      .required(),
  
    //
    // Validate date and time format: YYYY-MM-DDTHH:mm:ss
    //
    dateTime: Joi.date().format('YYYY-MM-DDTHH:mm:ss').raw(),
  
    //
    // Validate date and time format: YYYY-MM-DDTHH:mm:ss, required
    //
    dateTimeRequired: Joi.date().format('YYYY-MM-DDTHH:mm:ss').raw()
      .required(),
  
    //
    // Function to validate allowed list of strings
    //
    allowedStrings: allowed => Joi.string().equal(allowed),
  
    //
    // Validate allowed lisf of strings, required
    //
    allowedStringsRequired: allowed => Joi.string().equal(allowed).required(),
  
    //
    // Validate allowed lisf of integers
    //
    allowedIntegers: allowed => Joi.number().integer().equal(allowed).raw(),
  
    //
    // Validate allowed lisf of integers, required
    //
    allowedIntegersRequired: allowed => Joi.number().integer().equal(allowed).raw()
      .required(),
  
    //
    // Validate strings
    //
    string: Joi.string().allow(''),
  
    //
    // Validate strings, does not allow '' empty string, required
    //
    stringRequired: Joi.string().required().disallow(''),
  
    //
    // Validate strings, does not allow '' empty string
    //
    stringNotEmpty: Joi.string().invalid(''),
  
    //
    // Validate numeric/integer values
    //
    integer: Joi.number().integer(),
  
    //
    // Validate an int(10): Numeric, integer, min 0, max 2147483647
    //
    int10MinZero: Joi.number().integer().min(0).max(NUMBER_TYPES.INT),
  
    //
    // Validate numeric/integer values, required
    //
    integerRequired: Joi.number().integer().required(),
  
    //
    // Validate an email
    //
    email: Joi.string().email().allow(''),
  
    //
    // Validate an email
    //
    emailNotEmpty: Joi.string().email().invalid(''),
  
    //
    // Validate an email, required
    //
    emailRequired: Joi.string().email().required(),
  
    //
    // Validate specific zipcode length: 4
    //
    zipCode4: Joi.string().regex(/^[0-9]{4}$/),
  
    //
    // Validate specific zipcode length: 4 required
    //
    zipCode4Required: Joi.string().regex(/^[0-9]{4}$/).required(),
  
    //
    // Validate specific zipcode length: 5
    //
    zipCode5: Joi.string().regex(/^[0-9]{5}$/),
  
    //
    // Validate specific zipcode length: 5, required
    //
    zipCode5Required: Joi.string().regex(/^[0-9]{5}$/).required(),
  
    //
    // Validate if value is 0 or 1
    //
    binaryOptions: Joi.number().equal(0, 1),
  
    //
    // Validate if value is 0 or 1, required
    //
    binaryOptionsRequired: Joi.number().equal(0, 1).required(),
  
    //
    // Function to validate boolean values. Not string allowed
    //
    boolean: Joi.boolean().invalid('true', 'false'),
  
    //
    // Validate boolean values. Not string allowed
    //
    booleanRequired: Joi.boolean().invalid('true', 'false').required(),
  
    //
    // Validate boolean values. Can be used with query/uri parameters.
    //
    booleanString: Joi.string().equal(['true', 'false']),
  
    //
    // Validate boolean values. Can be used with query/uri parameters. Required
    //
    booleanStringRequired: Joi.string().equal(['true', 'false']).required(),
  
    //
    // Validate an lookup Id
    //
    lookupId: (key, idKey = 'id') => Joi.number().integer().min(1).strict()
      .lookup(key, idKey),
  
    //
    // Validate an lookup Id, required
    //
    lookupIdRequired: (key, idKey = 'id') => Joi.number().lookup(key, idKey).required(),
  
    //
    // Validate an lookup name
    //
    lookupName: (key, idKey = 'name') => Joi.string().lookup(key, idKey),
  
    //
    // Validate an lookup name, required
    //
    lookupNameRequired: (key, idKey = 'name') => Joi.string().lookup(key, idKey).required(),
  
    //
    // Validate time format
    //
    time: Joi.date().format('HH:mm'),
  
    //
    // Validate time format
    //
    timeRequired: Joi.date().format('HH:mm').required(),
  
    //
    // Validate optional url parameters
    //
    uriIdParamsArray: Joi.string().urlParamsArray(),
  
    //
    // Validate required url parameters
    //
    uriIdParamsArrayRequired: Joi.string().urlParamsArray().required(),
    //
    // Validate decimal values
    //
    decimal: Joi.number().precision(2),
  
    //
    // Validate phoneAreaCode
    //
    phoneAreaCode: Joi.string().regex(/^[0-9]{3}$/).length(3)
      .options({
        language: {
          string: {
            regex: {
              base: 'Must be a valid 3 digit phone area code',
            },
          },
        },
      }),
  
    //
    // Validate phonePrefix
    //
    phonePrefix: Joi.string().regex(/^[0-9]{3}$/).length(3)
      .options({
        language: {
          string: {
            regex: {
              base: 'Must be a valid 3 digit phone prefix',
            },
          },
        },
      }),
  
    //
    // Validate phone line number
    //
    phoneLineNumber: Joi.string().regex(/^[0-9]{1,15}$/).options({
      language: {
        string: {
          regex: {
            base: 'Must be a valid phone line number',
          },
        },
      },
    }),
  
    //
    // Validate phone extension
    //
    phoneExtension: Joi.string().regex(/^[0-9]{0,6}$/).options({
      language: {
        string: {
          regex: {
            base: 'Must be a valid [0-6] digit phone extension',
          },
        },
      },
    }),
  });`;
function getBsaRules() {
  const bsaRulesNoComments = bsaRules.replace(/\/\/.*/g, '').replace(/\s+/g, ' ');
  const rules = new RegExp(`const rules = Joi => \\(\\{([^;]*)`, 'igm').exec(bsaRulesNoComments);
  const properties = splitHighOrder(rules[1], /,/);
  console.log(properties);
  const result = properties.map(parsePropertyRule).filter(value => value != null);
  console.log(result);
  return result;
}

function parsePropertyRule(propertyRule) {
  const result = /^(\w+):\sJoi.(.+)$/ig.exec(propertyRule);
  if (result != null) {
    const [, property, rulesString] = result;
    const joiMethods = splitHighOrder(rulesString, /\./);
    console.log(joiMethods);
    const base = joiMethods.shift();
    return { base, rules: joiMethods, property };
  } else {
    console.log(`cant process ${propertyRule}`);
    return null;
  }

}

module.exports = getBsaRules();

},{"./split-high-order":7}],4:[function(require,module,exports){
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

function formatSchema(update, insert, tableName) {
  const values = [];
  if (insert) {
    values.push(`postPayload: ${insert}`);
  }
  if (update) {
    values.push(update);
  }
  const objectDeclaration =
    `const ${normalizeColumnName(tableName)}Schema = {
    ${values.join('\n    ')}
};`;
  return objectDeclaration;
}

function formatSchemaInsert(values) {
  const valuePropertyStrings = values.map(value => `${value.property}: ${value.sentence},`);
  const objectDeclaration =
    `{
        ${valuePropertyStrings.join('\n        ')}
  },`;
  return objectDeclaration;
}

function formatObjectUpdate(values) {
  const valuePropertyStrings = values.map(value => `${value.property}: ${value.sentence},`);
  const objectDeclaration =
    `    const putPayloadKeys = {
            ${valuePropertyStrings.join('\n            ')}
    };`;
  const propertyObject = `get putPayload() {
    ${objectDeclaration}
    return bsaJoi.object(putPayloadKeys).or(Object.keys(putPayloadKeys));
},`
  return propertyObject;
}

module.exports = { formatObjectUpdate, formatSchemaInsert, formatSchema, completeBsaRules };
},{}],5:[function(require,module,exports){

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
},{"./bsa-rules":3,"./bsa-rules-match":2,"./formatters":4,"./parsers":6,"./split-high-order":7}],6:[function(require,module,exports){
const dataTypes = {
    varchar: 'string',
    nvarchar: 'string',
    text: 'string',
    int: 'number, integer()',
    bigint: 'number, integer()',
    tinyint: 'number, integer()',
    smallint: 'number, integer()',
    bit: 'boolean',
    float: 'number',
    numeric: 'number',
    decimal: 'number, precision(2)',
    real: 'number',
    date: 'date',
    datetime: 'date',
    datetime2: 'date',
    datetimeoffset: 'date',
    smalldatetime: 'date',
    time: 'date',
    uniqueidentifier: 'string, guid()',
    smallmoney: 'number',
    money: 'number',
    binary: 'string',
    varbinary: 'string',
    image: 'string',
    xml: 'string',
    char: 'string',
    nchar: 'string',
    ntext: 'string',
    text: 'string',
    tvp: 'string',
    udt: 'string',
    geography: 'string',
    geometry: 'string',
    variant: 'string',
  };


const { getCloseSymbol } = require('./split-high-order');

class GenericParser {
    constructor(name, type, typeArgs, modifiers, update) {
        this.name = name;
        this.type = type;
        this.typeArgs = typeArgs;
        this.modifiers = modifiers;
        this.update = update;
        this.joiBase = '';
        this.joiRules = [];
        this.getJoiBase();
        this.getRules();
    }

    getJoiBase() {
        const joiBaseComplete = dataTypes[this.type.toLowerCase()];
        const result = joiBaseComplete.split(',');

        this.joiBase = result.shift();
        this.joiBase = `${this.joiBase}()`;
        this.joiRules = result.map(rule => rule.trim());
    }

    getRules() {
        if (this.update) {
            if (!this.modifiers.match(/NOT\s+NULL/i)) {
                this.joiRules.push('allow(null)');
            }
        } else {
            if (this.modifiers.match(/NOT\s+NULL/i)) {
                this.joiRules.push('required()');
            }
        }

    }

}

class VarCharParser extends GenericParser {
    constructor(...args) {
        super(...args);
    }
    getRules() {
        super.getRules()
        const lengthValue = this.typeArgs;
        this.joiRules.push(`max(${lengthValue})`);
    }
}

class CharParser extends GenericParser {
    constructor(...args) {
        super(...args);
    }
    getRules() {
        super.getRules()
        const lengthValue = this.typeArgs;
        this.joiRules.push(`length(${lengthValue})`);
    }
}

function ParserFactory(name, type, typeArgs, modifiers, update) {
    if (type.toLowerCase() === 'varchar' || type.toLowerCase() === 'nvarchar') {
        return new VarCharParser(name, type, typeArgs, modifiers, update);
    }
    if (type.toLowerCase() === 'char' || type.toLowerCase() === 'nchar') {
        return new CharParser(name, type, typeArgs, modifiers, update);
    }
    return new GenericParser(name, type, typeArgs, modifiers, update);
}


function processSqlTableDeclaration(tableDeclaration) {
    const tableNormalized = tableDeclaration.replace(/\s+/g, ' ');
    const result = /^\s*create\s*table\s*((\[?\w+\]?\.)*\[?(\w+)\]?)\s+\((.*)/i.exec(tableNormalized);
    if (result == null) {
        return new Error(`can't process table declaration`);
    }

    const [, , , tableName, matchContent] = result;
    const cutPos = getCloseSymbol(matchContent, '(', 0);
    const content = matchContent.substring(0, cutPos);
    return {
        tableName, content
    }
}

function getJoiRulesFromColumnDefinition(update, columnDefinition) {
    const result = /^\[?(\w+)\]?\s+(\w+)(\(([^)]+)\))?(.*)$/ig.exec(columnDefinition);
    if (result == null) {
        return null;
    }
    const [, name, type, , typeArgs, modifiers] = result;
    if (dataTypes[type.toLowerCase()] == null) {
        return null;
    }
    if(/identity/i.test(modifiers)){
        return null;
    }
    const joiParser = ParserFactory(name, type, typeArgs, modifiers, update);
    return joiParser;
}

module.exports = { getJoiRulesFromColumnDefinition, processSqlTableDeclaration };


},{"./split-high-order":7}],7:[function(require,module,exports){
const regexOpeningSymbols = /[({[]/ig;

function getCloseCharacter(openSymbol) {
  switch (openSymbol) {
    case '(':
      return ')';
    case '{':
      return '}';
    case '[':
      return ']';
  }
}

function getCloseSymbol(string, openSymbol, startPos) {
  const closeSymbolChar = getCloseCharacter(openSymbol);
  for (let i = startPos + 1; i < string.length; i++) {
    const currentChar = string.charAt(i);
    if (currentChar.match(regexOpeningSymbols)) {
      const indexCloseSimbol = getCloseSymbol(string, currentChar, i);
      i = indexCloseSimbol;
      continue;
    }
    if (currentChar.match(new RegExp(`\\${closeSymbolChar}`))) {
      return i;
    }
  }
}

function splitHighOrder(string, regex) {
  const resultsStrings = new Array();
  let lastMatchIndex = 0;
  for (let i = 0; i < string.length; i++) {
    const currentChar = string.charAt(i);
    if (currentChar.match(regexOpeningSymbols)) {
      const indexCloseSimbol = getCloseSymbol(string, currentChar, i);
      i = indexCloseSimbol;
      continue;
    }
    if (currentChar.match(regex)) {
      const substring = string.substring(lastMatchIndex, i).trim();
      resultsStrings.push(substring);
      lastMatchIndex = i + 1;
    }
  }
  const substring = string.substring(lastMatchIndex).trim();
  resultsStrings.push(substring);
  return resultsStrings;
}

module.exports = { splitHighOrder, getCloseSymbol };
},{}]},{},[1]);
