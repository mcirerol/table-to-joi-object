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