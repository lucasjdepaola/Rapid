console.log(JSTree); // javascript tokens
console.log(HTMLTree); // html tokens
const languageMap = { // map containing the tokens
  "js": JSTree,
  "html": HTMLTree
};
let syntaxHighlight = [[]]; // syntax highlighting
let highlightCache = [[]]; // syntax highlighting cache
let currentTheme = defaultTheme;
/* lex the page range of the render, to give syntax highlighting on the front end */
const lex = (keyWords) => {
  updateOffsetChart();
  let accumStr = ""; // string used to accumulate a current token being built
  const tokenArr = [];
  const lexParseRegex = /[\[\]\(\)%!#*^;\.]/; // everything that can parse a word that also needs to be added
  for (let i = chart.start; i < chart.end; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      const c = matrix[i][j];
      if (lexParseRegex.test(c)) { // when a special character occurs we reset the lexing
        if (accumStr in keyWords)
          tokenArr.push({ color: currentTheme[keyWords[accumStr]], coords: { row: i, from: j - accumStr.length, to: j - 1 } });
        console.log(keyWords[accumStr]);
        accumStr = ""; // since the character parses the string
      }
      else if (c === " ") {
        if (accumStr in keyWords) {
          tokenArr.push({ color: currentTheme[keyWords[accumStr]], coords: { row: i, from: j - accumStr.length, to: j - 1 } });
          accumStr = "";
        }
      } else {
        accumStr += c;
      }
    }
  }
  return tokenArr;
}

const syntaxHighlightFile = () => {
  const extension = getFileExtension(currentFilename);
  const keyWords = languageMap[extension];
  if (keyWords === undefined) return; // don't highlight on bad extensions
  const lexedTokens = lex(keyWords["keywords"]);
  console.log(lexedTokens);
}
