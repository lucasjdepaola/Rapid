console.log(JSTree); // javascript tokens
console.log(HTMLTree); // html tokens
const languageMap = { // map containing the tokens
  "js": JSTree,
  "html": HTMLTree
};
let syntaxHighlight = []; // syntax highlighting
let currentTheme = defaultTheme;


/* lex the page range of the render, to give syntax highlighting on the front end */
const lex = (keyWords) => {
  updateOffsetChart();
  const peek = (index) => {
    return index + 1 < keyWords.length ? keyWords[index + 1] : null;
  }
  const returnMap = (color, row, from, to) => {
    return {
      color: color,
      coords: {
        row: row,
        from: from,
        to: to
      }
    }
  }
  let accumStr = ""; // string used to accumulate a current token being built
  const lexParseRegex = /[\[\]\(\)%!#*^;\.]/; // everything that can parse a word that also needs to be added
  for (let i = chart.start; i < chart.end; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      const c = matrix[i][j];
      if (lexParseRegex.test(c)) { // when a special character occurs we reset the lexing
        if (accumStr in keyWords)
          syntaxHighlight.push({ color: currentTheme[keyWords[accumStr]], coords: { row: i, from: j - accumStr.length, to: j - 1 } });
        accumStr = ""; // since the character parses the string
      }
      else if (c === " ") {
        if (accumStr in keyWords) {
          syntaxHighlight.push({ color: currentTheme[keyWords[accumStr]], coords: { row: i, from: j - accumStr.length, to: j - 1 } });
          accumStr = "";
        }
      } else {
        accumStr += c;
      }
    }
  }
  return syntaxHighlight;
}


const syntaxHighlightFile = () => {
  syntaxHighlight = [];
  const extension = getFileExtension(currentFilename);
  const keyWords = languageMap[extension];
  if (keyWords === undefined) return; // don't highlight on bad extensions
  const lexedTokens = lex(keyWords["keywords"]);
  console.log(syntaxHighlight);
  console.log("hi");
  // there might need to be a step in between
}
