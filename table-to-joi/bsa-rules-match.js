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