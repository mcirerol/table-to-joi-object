const requiredJoiRules = {
  'required()': true,
  'integer()': true,
  'guid()': true,
}

const specificRulesByColumnNamesMatches = [/zip(code)?5/ig, /zip(code)?4/ig, /email/ig, /phoneAreacode/ig, /phonePrefix/ig, /phoneLineNumber/ig, /phoneExtension/ig];

function columnNameMatchesSpecificRule(columnName) {
  return specificRulesByColumnNamesMatches.find(regexRule => regexRule.test(columnName));
}

function getBsaRulesByRegex(regex, bsaRules) {
  return bsaRules.filter(rule => regex.test(rule.property))
}

function getMatchesFilterByRequired(bsaRules, joiDefinition) {
  return bsaRules.map((bsaRule) => {
    const match = {};
    match.matchedRules = joiDefinition.joiRules;
    if (joiDefinition.joiRules.includes('required()')) {
      if (!bsaRule.rules.includes('required()')) {
        match.matchedRules = match.matchedRules.slice(0);
        match.matchedRules.splice(match.matchedRules.indexOf('required()'), 1);
      }
    }else{
      
    }
    match.bsaRule = bsaRule;
    return match;
  })
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
  if (bsaRule.base === joiDefinition.joiBase && rulesMatch(bsaRule, joiDefinition)) {
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
    return getMatchesFilterByRequired(matchedRules, joiDefinition)
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