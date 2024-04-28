const lexParseRegex = /[\[\]\(\)%!*^;,:\.<>=/]/; // everything that can parse a word that also needs to be added
const languageMap = { // map containing the tokens
  "js": JSTree,
  "html": HTMLTree,
  "c": CTree,
  "py": PythonTree,
  "lua": luaTree,
  "shank": ShankTree,
  "sia": Sia32Tree,
  "css": CSSTree,
  "md": MDTree
};
let syntaxHighlight = []; // syntax highlighting
let accumList = []; // list for accumulated words (should maybe have a larger scope)

const invertHex = (hex) => {
  return "black";
}


/* lex the page range of the render, to give syntax highlighting on the front end */
const lex = (keyWords) => {
  updateOffsetChart();
  const peek = (row, col) => {
    return col + 1 < matrix[row].length ? matrix[row][col + 1] : null;
  }
  const eraseAccum = () => {
    if (!accumList.includes(accumStr))
      accumList.push(accumStr);
    accumStr = "";
  }
  let startQuote = false; // for quote state
  let quoteFrom = 0;
  accumList = [];
  let accumStr = ""; // string used to accumulate a current token being built, line basis
  for (let i = chart.start; i < chart.end; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (startQuote && matrix[i][j] !== '"') continue; // skip iteration if quote state
      const c = matrix[i][j];
      if (lexParseRegex.test(c)) { // when a special character occurs we reset the lexing
        if (c === "/" && peek(i, j) === "/") {
          // comment state
          syntaxHighlight.push({ color: currentTheme["comment"], coords: { row: i, from: j, to: matrix[i].length - 1 } });
          i++; // go to next col
          j = -1;
          eraseAccum();
          if (i >= matrix.length) break;
        }
        // TODO if style !== undefined -> predefined style
        else if (accumStr in keyWords)
          syntaxHighlight.push({ color: currentTheme[keyWords[accumStr]], coords: { row: i, from: j - accumStr.length, to: j - 1 } });
        else if (c === "(") {
          syntaxHighlight.push({ color: currentTheme["function"], coords: { row: i, from: j - accumStr.length, to: j - 1 } });
        }
        else if (/^-?[0-9]+$/.test(accumStr)) { // number case
          syntaxHighlight.push({ color: currentTheme["numbers"], coords: { row: i, from: j - accumStr.length, to: j - 1 } });
        }
        else if (accumStr[0] === "#" && accumStr.length === 7) { // hex
          syntaxHighlight.push({ background: accumStr, color: "white", coords: { row: i, from: j - accumStr.length, to: j - 1 } });
        }
        else if (accumStr === "TODO") {
          syntaxHighlight.push({ background: currentTheme["boolean"], color: "white", coords: { row: i, from: j - accumStr.length, to: j - 1 } })
        }
        eraseAccum();
      }
      else if (c === " ") {
        if (accumStr in keyWords) {
          syntaxHighlight.push({ color: currentTheme[keyWords[accumStr]], coords: { row: i, from: j - accumStr.length, to: j - 1 } });
        }
        else if (/^-?[0-9]+$/.test(accumStr)) {
          syntaxHighlight.push({ color: currentTheme["numbers"], coords: { row: i, from: j - accumStr.length, to: j - 1 } });
        }
        else if (accumStr[0] === "#" && accumStr.length === 7) {
          syntaxHighlight.push({ background: accumStr, color: "" + invertHex(accumStr.slice(1, accumStr.length)), coords: { row: i, from: j - accumStr.length, to: j - 1 } });
        }
        else if (accumStr === "TODO") {
          syntaxHighlight.push({ background: currentTheme["boolean"], color: "white", coords: { row: i, from: j - accumStr.length, to: j - 1 } })
        }
        eraseAccum();
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
      else {
        accumStr += c;
      }
    }
  }
}



const syntaxHighlightFile = () => {
  const extension = getFileExtension(currentFilename); // should not be called as often
  const keyWords = languageMap[extension];
  if (keyWords === undefined) return; // don't highlight on bad extensions
  syntaxHighlight = [];
  lex(keyWords["keywords"]);
}
