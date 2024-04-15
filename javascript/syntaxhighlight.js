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
  const lexParseRegex = /[\[\]\(\)%!#*^;\.]/; // everything that can parse a word that also needs to be added
  let startQuote = false; // for quote state
  let quoteFrom = 0;
  for (let i = chart.start; i < chart.end; i++) {
    let accumStr = ""; // string used to accumulate a current token being built, line basis
    for (let j = 0; j < matrix[i].length; j++) {
      if (startQuote && matrix[i][j] !== '"') continue; // skip iteration if quote state
      const c = matrix[i][j];
      if (lexParseRegex.test(c)) { // when a special character occurs we reset the lexing
        if (accumStr in keyWords)
          syntaxHighlight.push({ color: currentTheme[keyWords[accumStr]], coords: { row: i, from: j - accumStr.length, to: j - 1 } });
        accumStr = ""; // since the character parses the string
      }
      else if (c === " ") {
        if (accumStr in keyWords) {
          syntaxHighlight.push({ color: currentTheme[keyWords[accumStr]], coords: { row: i, from: j - accumStr.length, to: j - 1 } });
        }
        accumStr = "";
      }
      else if (c === '"') {
        if (startQuote) {
          startQuote = false;
          syntaxHighlight.push({ color: currentTheme["quotes"], coords: { row: i, from: quoteFrom, to: j } });
        } else {
          startQuote = true;
          quoteFrom = j; // start the quote process
        }
      }
      else if (c === "/" && peek(i) === "/") {
        // comment state
        syntaxHighlight.push({ color: currentTheme["comment"], coords: { row: i, from: i, to: matrix[i].length - 1 } });
        i++; // go to next col
      }
      else {
        accumStr += c;
      }
    }
  }
  return syntaxHighlight;
}


const syntaxHighlightFile = () => {
  const extension = getFileExtension(currentFilename); // should not be called as often
  const keyWords = languageMap[extension];
  if (keyWords === undefined) return; // don't highlight on bad extensions
  syntaxHighlight = [];
  lex(keyWords["keywords"]);
  console.log(syntaxHighlight);
  // there might need to be a step in between
}
