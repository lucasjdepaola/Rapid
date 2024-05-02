let cmpIsOn = false; // change during testing
validCommands["cmp"] = () => { cmpIsOn = !cmpIsOn }; // toggle cmp
const CMPLEN = 5; // only show 5 completions
const getCurrCmp = () => {
  let start = 0;
  let end = matrix[coords.row].length - 1;
  for (let i = coords.col; i < matrix[coords.row].length; i++) {
    if (lexParseRegex.test(matrix[coords.row][i]) || matrix[coords.row][i] === " ") {
      end = i;
      break;
    }
  }
  for (let i = end - 1; i >= 0; i--) {
    if (lexParseRegex.test(matrix[coords.row][i]) || matrix[coords.row][i] === " ") {
      start = i + 1;
      break;
    }
  }
  return matrix[coords.row].slice(start, end).join("");
}

const fzfArr = (string, arr) => {
  if (string === "") return arr;
  string = string.toLowerCase();
  const a = [];
  let num = 0;
  let cache = 0;
  let flag = false;
  for (let e of arr) {
    e = e.toLowerCase();
    let str = string;
    for (s of string) {
      num = e.indexOf(s);
      if (num === -1 || num < cache) {
        flag = true;
      } else {
        str = str.replace(s, "");
      }
    }
    if (!flag) a.push(e);
    flag = false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i].toLowerCase() === string) a.splice(i, 1);
  }
  return a;
}
