const requiredJoiRules = {
    'required()': true,
    'integer()': true,
    'guid()': true,
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
      if(joiDefinition.joiRules.includes(rule)){
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

function getbsaRuleMatches(joiDefinition, bsaRules) {
    const matches = [];
    for (let i = 0; i < bsaRules.length; i++) {
      const matchResult = match(joiDefinition, bsaRules[i]);
      if (matchResult != null) {
        matches.push(matchResult);
      }
    }
    return matches;
  }

function getMatchs(joiDefinitions, rules){
    const matchedRules = joiDefinitions.map(joiDefinition => getbsaRuleMatches(joiDefinition, rules));
    const bsaRulesMatchs = matchedRules.map((matches, index) => {
      const match = getBestMatch(null, matches);
      const joiDefinition = joiDefinitions[index];
      return { match, joiDefinition };
    })
    return bsaRulesMatchs;
}

module.exports = { getMatchs };