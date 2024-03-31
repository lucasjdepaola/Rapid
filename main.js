const text = document.getElementById("text");
const bg = document.getElementById("bg");
const command = document.getElementById("command");
let matrix = [[" "]];
const filemap = {}; // keep track of all files
let currentFilename = "Untitled";
const keys =
  "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()";
const states = {
  "insert": "INSERT",
  "normal": "NORMAL",
  "visual": "VISUAL",
  "awaitKey": "AWAITKEY",
  "search": "SEARCH",
  "command": "COMMAND",
};
let currentlyHighlighting = false;
let capitalV = false;
let vimcopybuffer = ""; // this is what keeps track of the vim buffer when yanking or deleting
let buildAwaitStr = ""; // to build the entire motion, such as fa, diw, ciw, d$
let searchArr = [];
let searchCoords = [];
let nKey = false; // for searching around
let searchIndex = 0; // to determine which to center it on
let commandArr = [];
let currentState = states.insert;
let visualcoords = { // when highlighting, create a range from where the highlight begins and ends
  from: {
    row: 0,
    col: 0,
  },
  to: {
    row: 0,
    col: 0,
  },
};
const coords = {
  row: 0,
  col: 0,
};
let prevcol = 0;

const canvas = {
  lightpink: "rgba(255, 210, 249, .5)",
  neohighlight: "rgba(48, 77, 117, .5)",
  whitetransparent: "rgba(255, 255, 255, .5)",
  highlightyellow: "rgba(252, 221, 57, .5)",
};
const media = { // collection of potential background images
  none: "none",
  matrix:
    "https://i.pinimg.com/originals/21/7d/a2/217da299cc918fad9b76eb99e4bb75b3.gif",
  subway:
    "https://www.pixground.com/wp-content/uploads/2024/03/Subway-Tunnel-Painting-4K-Wallpaper-1081x608.webp",
  coolplanet:
    "https://i.pinimg.com/originals/7e/ea/01/7eea01a7a420f7bcc39064b7dc9252fd.jpg",
  hawk:
    "https://wallpapers.com/images/hd/mysterious-1920-x-1080-wallpaper-kcflzidhjqcxcgpe.jpg",
};

const imagefunc = (url) => {
  return url;
};
bg.style.backgroundImage = "url(" + imagefunc(media.coolplanet) + ")"; //test

const macros = {}; // a letter binds to a macro string, which is interpreted by the emulateKeys function
const mark = {}; // a letter binds to a coordinate which acts as a cursor position

const motions = {
  yank: "YANK",
  delete: "DELETE",
  c: "C",
  visual: "VISUAL",
};
const HIGHLIGHTCOLOR = canvas.lightpink;
const filebar = document.getElementById("topbar");
let fileStyles =
  "style='position:inherit; height:100%; margin-top:auto; margin-bottom:auto; vertical-align:middle; align-items:center;'";
const startmap = {}; // map for brackets and paren
startmap["{"] = "}";
startmap["("] = ")";
startmap["["] = "]";
startmap['"'] = '"';
startmap["'"] = "'";
const endmap = {};
endmap[")"] = "(";
endmap["}"] = "{";
endmap["]"] = "[";
endmap['"'] = '"';
endmap["'"] = "'";
const cmpregex = /[(\[{"]/;
const endregex = /[)\]}"]/;
let autoTab = "";
const TABWIDTH = "  ";
const scopeElement = document.getElementById("scope");
let scopeToggled = false;

const rapid = (key) => {
  /* cases for alt key, control key, backspace, etc */
  if (key.key === " ") key.preventDefault();
  nKey = (key.key === "n" || key.key === "N") && currentState === states.normal;
  if (key.key.length > 1) {
    if (key.key === "Enter") {
      /* increment row, push new matrix before it */
      if (currentState === states.insert) {
        if (inBraces()) {
          autoTab += TABWIDTH;
          matrix[coords.row].splice(coords.col, 1); // why?
          appendRow();
          matrix[coords.row].unshift(
            ...autoTab.split("").slice(0, autoTab.length - TABWIDTH.length),
            "}",
          );
          decrementRow();
        }
        appendRow();
        console.log(autoTab.length);
        console.log(...autoTab.split(""));
        matrix[coords.row].unshift(...autoTab.split(""));
        coords.col = autoTab.length;
      } else if (currentState === states.search) {
        nKey = true;
        if (searchCoords.length < 1) {
          currentState = states.normal;
          searchArr = [];
          renderSearch();
          return;
        }
        console.log(searchCoords[0].row);
        coords.row = searchCoords[0].row;
        coords.col = searchCoords[0].start;
        currentState = states.normal; // wedont want it to be immediately unhighlighted
        // searchArr = []; // dont keep this, we want searches to stay on a successful case
        renderSearch();
        // TODO find function that sets cursor to the first highlight
      } else {
        interpretCommand();
      }
    } else if (key.key === "Escape") {
      currentState = states.normal; // go into normal mode
      toggleScope();
    } else if (key.key === "Backspace") {
      if (key.ctrlKey) {
        ctrlBack();
      } else if (currentState === states.command) {
        commandArr.pop();
        if (commandArr.length === 0) {
          currentState = states.normal;
          renderCommand();
        }
      } else if (currentState === states.search) {
        searchArr.pop();
        if (searchArr.length === 0) {
          currentState = states.normal;
        }
        search();
      } else if (currentState === states.insert) {
        delBackspace();
      }
    }
  } else {
    /* regular key case */
    if (currentState === states.normal) {
      if (key.key === "j") {
        if (coords.row < matrix.length - 1) {
          incrementRow();
          updateLineNumber();
        }
      } else if (key.key === "k") {
        if (coords.row > 0) {
          decrementRow();
          updateLineNumber();
        }
      } else if (key.key === "h") {
        decrementCol();
        updatePrevCol();
      } else if (key.key === "l") {
        incrementCol();
        updatePrevCol();
      } else if (key.key === "L" || key.key === "$") {
        changeToLastCol();
        updatePrevCol();
      } else if (key.key === "H" || key.key === "0" || key.key === "^") {
        changeToFirstCol();
        updatePrevCol();
      } else if (key.key === "G") {
        changeToLastRow();
      } else if (key.key === "i") {
        currentState = states.insert;
      } else if (key.key === "I") {
        coords.col = 0;
        currentState = states.insert;
        updatePrevCol();
      } else if (key.key === "a") {
        incrementCol();
        updatePrevCol();
        currentState = states.insert;
      } else if (key.key === "A") {
        coords.col = matrix[coords.row].length - 1; // set to beginning
        updatePrevCol();
        currentState = states.insert;
      } else if (key.key === "x") {
        del(1);
      } else if (key.key === "r") {
        buildAwaitStr = "r";
        currentState = states.awaitKey;
      } else if (key.key === "s") {
        del(1);
        currentState = states.insert;
      } else if (key.key === "f") {
        if(key.ctrlKey) {
          key.preventDefault();
          toggleScope();
        } else {
          currentState = states.awaitKey;
          buildAwaitStr += "f";
        }
      } else if (key.key === "t") {
        currentState = states.awaitKey;
        buildAwaitStr += "t";
      } else if (key.key === "o") {
        appendRow();
        currentState = states.insert;
      } else if (key.key === "O") {
        appendRowBackwards();
        currentState = states.insert;
      } else if (key.key === "w") {
        movew();
      } else if (key.key === "b") {
        moveb();
      } else if (key.key === "e") {
        movee();
      } else if (key.key === "v") {
        visualcoords.from.row = coords.row;
        visualcoords.from.col = coords.col;
        currentlyHighlighting = !currentlyHighlighting;
      } else if (key.key === "V") {
        visualcoords.from.row = coords.row;
        visualcoords.from.col = 0;
        visualcoords.to.col = matrix[coords.row].length - 1; // we highlight the entire col for V
        currentlyHighlighting = !currentlyHighlighting;
        capitalV = !capitalV;
      } else if (key.key === "d") {
        if (currentlyHighlighting) {
          deleteVisualRange();
          currentlyHighlighting = false;
        } else {
          buildAwaitStr += "d";
          currentState = states.awaitKey;
        }
      } else if (key.key === "y") {
        yankVisualRange();
      } else if (key.key === "c") {
        if (currentlyHighlighting) {
          deleteVisualRange();
          currentState = states.insert;
          currentlyHighlighting = false;
        } else {
          buildAwaitStr += "c";
          currentState = states.awaitKey;
        }
      } else if (key.key === "p") {
        pasteBuffer();
      } else if (key.key === ":" || key.key === ";") {
        currentState = states.command;
      } else if (key.key === "/") { // search state
        searchCoords = [];
        searchArr = [];
        searchIndex = 0;
        currentState = states.search;
        renderSearch();
      } else if (key.key === ">") {
        rightArrow();
      } else if (key.key === "<") {
        leftArrow();
      } else if (key.key === "n") {
        if (searchCoords.length > 0) {
          coords.row = searchCoords[searchIndex].row;
          coords.col = searchCoords[searchIndex].start;
          if (searchIndex < searchCoords.length - 1) searchIndex++;
        }
      } else if (key.key === "N") {
      }
    } else if (currentState === states.insert) { // insert()
      /* append letter to the current row and column which increments */
      if (key.ctrlKey) {
        if (key.key === "c") {
          currentState = states.normal;
        } else if (key.key === "v") {
          pasteFromOS();
        } else if (key.key === "y") {
          if (currentlyHighlighting) {
            copyInHighlightedRange();
          } else {
            copyMatrixToOS();
          }
        }
        else if(key.key === "f") {
          key.preventDefault();
          toggleScope();
        }
      } else if (key.key === "j") {
        buildAwaitStr = "j";
        appendText(key.key);
      } else if (buildAwaitStr === "j") {
        if (key.key === "k") {
          currentState = states.normal;
          decrementCol();
          del(1);
        } else {
          appendText(key.key);
        }
        buildAwaitStr = "";
      } else if (cmpregex.test(key.key)) {
        appendText(key.key);
        appendText(startmap[key.key]);
        coords.col--;
        updatePrevCol();
      } else if (endregex.test(key.key) && endregex.test(peek())) {
        incrementCol();
      } else {
        appendText(key.key);
        updatePrevCol();
      }
    } else if (currentState === states.awaitKey) {
      /* awaiting states such as f( diw dfl etc */
      if (buildAwaitStr === "f") {
        setFind(key.key);
        currentState = states.normal;
        buildAwaitStr = "";
      } else if (buildAwaitStr === "t") {
        if (setFind(key.key)) {
          coords.col--; // t means before or to
        }
        currentState = states.normal;
        buildAwaitStr = "";
      } else if (buildAwaitStr === "r") {
        replaceChar(key.key);
        currentState = states.normal;
      } else if (
        buildAwaitStr === "c" || buildAwaitStr === "d" || buildAwaitStr === "y"
      ) {
        if (
          key.key === "i" || key.key === "a" || key.key === "f" ||
          key.key === "t"
        ) {
          buildAwaitStr += key.key;
        } else if (key.key === "d") {
          deleteLine();
          buildAwaitStr = "";
          currentState = states.normal;
        } else if (key.key === "c") {
          deleteLine();
          buildAwaitStr = "";
          currentState = states.insert;
        }
      } else if (
        buildAwaitStr === "di" || buildAwaitStr === "ci" ||
        buildAwaitStr === "vi" || buildAwaitStr === "yi"
      ) {
        buildAwaitStr += key.key;
        if (/[cdyv][iwaft][A-Za-z0-9()\[\]{}'\"]/.test(buildAwaitStr)) {
          //fully built motion
          if (buildAwaitStr === "diw") {
            diw();
            buildAwaitStr = "";
            currentState = states.normal;
          } else if (buildAwaitStr === "ciw") {
            ciw();
            buildAwaitStr = "";
            currentState = states.insert;
          } else if (/[()\[\]{}\"'<>]/.test(key.key)) {
            const motion = buildAwaitStr[0] === "d"
              ? motions.delete
              : buildAwaitStr[0] === "c"
              ? motions.c
              : buildAwaitStr[0] === "v"
              ? motions.visual
              : motions.yank;
            motionInChar(key.key, motion);
            buildAwaitStr = "";
          }
        }
      } else if (buildAwaitStr === "j") {
        if (key.key === "k") {
          del(2);
          decrementCol(); // change dec to loop with int param val
          currentState = states.normal;
          buildAwaitStr = "";
        }
      } else {
        currentState = states.normal; // return to normal it is not in constraint
        buildAwaitStr = "";
      }
    } else if (currentState === states.search) {
      searchCoords = [];
      searchArr.push(key.key);
      search(); // live search
      // renderText();
    } else if (currentState === states.command) {
      commandArr.push(key.key);
      if (key.key === "Enter") {
        interpretCommand();
      }
    }
  }
  if (currentlyHighlighting) updateVisualCoordinates();
  renderText();
  if (currentState === states.command) {
    renderCommand();
  }
};

document.addEventListener("keydown", rapid);
document.addEventListener("touchstart", () => {
  document.getElementById("mobile").focus();
});

const interpretCommand = () => {
  const cmdstr = commandArr.join("").trim();
  currentState = states.normal;
  commandArr = [];
  renderCommand(); // so the text goes away
  // now interpret the command
  const splitcmd = cmdstr.split(" ");
  if (splitcmd[0] === "e") {
    // edit from hashmap here
    save(currentFilename);
    if (filemap[splitcmd[1]] === undefined) {
      filemap[splitcmd[1]] = [[" "]]; // initialize new file
      if (document.getElementById(splitcmd[1] + "_file") === null) {
        createFileButton(splitcmd[1]);
      }
    }
    matrix = filemap[splitcmd[1]];
    unhighlightTab();
    currentFilename = splitcmd[1];
    coords.row = 0;
    coords.col = 0; // can save pos later
    updateFileName();
  } else if (splitcmd[0] === "w") {
    if (splitcmd.length === 2) {
      currentFilename = splitcmd[1];
      updateFileName();
    }
    save(currentFilename); // save current file
  } else if (splitcmd[0] === "background") {
    if (media[splitcmd[1]] !== undefined) {
      bg.style.backgroundImage = "url(" + media[splitcmd[1]] + ")";
      // TODO notification system listing backgrounds, for failed commands, echoing, etc
    }
  } else if (cmdstr === "copy") {
    copyMatrixToOS();
  }
  else if(cmdstr === "scope") {
    toggleScope();
  }
};

const save = (name) => {
  filemap[name] = matrix;
};

const centerCursor = () => {
  scrollRelToCursor();
};
let prevCursortop = 0;
const scrollRelToCursor = () => {
  //TODO work on this
  const rect = document.getElementById("livecursor");
  const wrapper = document.getElementById("textwrapper");
  const top = rect.offsetTop + (wrapper.offsetTop);
  wrapper.scrollTo(0, top - (window.innerHeight / 2));
};

const renderText = () => {
  let lineno = 0;
  let htmlstr = "";
  let searchHighlightIndex = 0;
  for (let i = 0; i < matrix.length; i++) {
    htmlstr += lineno < 10 ? "  " : lineno < 100 ? " " : "";
    htmlstr += lineno++ + "    ";
    // htmlstr += "   <span style='color:gold;'>" + lineno++ + "    </span>"
    for (let j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j] !== undefined) {
        if (coords.row === i && coords.col === j) {
          let span = "<span";
          if (currentState === states.insert) {
            span += " id='livecursor' style='border-left: 1px solid white'";
          } else {
            span +=
              " id='livecursor' style='background-color:white;color:black;'";
          }
          span += ">" + matrix[i][j] + "</span>";
          htmlstr += span;
        } else if (
          currentlyHighlighting && capitalV &&
          inRange(i, visualcoords.from.row, visualcoords.to.row)
        ) { // in visual range
          htmlstr += "<span style='background-color:" + HIGHLIGHTCOLOR + ";'>" +
            matrix[i][j] + "</span>";
        } else if (
          currentlyHighlighting &&
          inRange(i, visualcoords.from.row, visualcoords.to.row) &&
          inRange(j, visualcoords.from.col, visualcoords.to.col)
        ) {
          htmlstr += "<span style='background-color:" + HIGHLIGHTCOLOR + ";'>" +
            matrix[i][j] + "</span>";
        } else if (
          searchCoords.length > 0 &&
          (currentState === states.search || nKey) &&
          searchCoords[searchHighlightIndex] !== undefined &&
          searchCoords[searchHighlightIndex].row === i &&
          j >= searchCoords[searchHighlightIndex].start &&
          j <= searchCoords[searchHighlightIndex].end
        ) { // render search
          htmlstr += "<span style='background-color:" + canvas.highlightyellow +
            ";'>" + matrix[i][j] + "</span>";
          if (searchCoords[searchHighlightIndex].end === j) {
            searchHighlightIndex++;
          }
        } else {
          htmlstr += matrix[i][j];
        }
      }
    }
    htmlstr += "<br>";
  }
  text.innerHTML = htmlstr;
  // render with id here
  centerCursor();
};
renderText();

const renderCommand = () => {
  if (currentState !== states.command) {
    command.innerHTML = "";
    return;
  }
  command.innerHTML = "$ " + commandArr.join("") +
    "<span style='border-left:1px solid white;'> </span>";
};

const del = (num) => {
  for (let i = 0; i < num; i++) {
    matrix[coords.row].splice(coords.col, 1);
  }
};
const delBackspace = () => {
  if (coords.col === 0) {
    if (coords.row !== 0) coords.row--;
  } else {
    matrix[coords.row].splice(--coords.col, 1);
  }
};

const replaceChar = (key) => {
  matrix[coords.row].splice(coords.col, 1, key);
};

document.addEventListener("click", (coords) => {
}); // TODO implement a click cursor tracker mechanism

document.body.addEventListener("dragover", (e) => {
  e.preventDefault();
});
document.body.addEventListener("drop", (e) => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    importFile(files);
  }
});

const importFile = (files) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const newmatrix = e.target.result.split(/\r?\n/);
    for (let i = 0; i < newmatrix.length; i++) {
      newmatrix[i] = newmatrix[i].split("");
      newmatrix[i].push(" ");
    }
    matrix = newmatrix;
    // filemap[reader.target.file.name] = newmatrix;
    unhighlightTab(currentFilename);
    currentFilename = reader.fileName;
    createFileButton(currentFilename);
    updateFileName();
    coords.col = 0;
    coords.row = 0;
    renderText();
  };
  for (const file of files) {
    reader.readAsText(file);
    reader.fileName = file.name;
  }
};

const incrementCol = () => {
  if (coords.col < matrix[coords.row].length - 1) coords.col++;
};

const decrementCol = () => {
  if (coords.col > 0) coords.col--;
};

const incrementRow = () => {
  if (coords.row < matrix.length - 1) coords.row++;
};

const decrementRow = () => {
  if (coords.row > 0) coords.row--;
};

const setFind = (key) => {
  // iterate over current find row, from cursor
  for (let i = coords.col; i < matrix[coords.row].length; i++) {
    if (matrix[coords.row][i] === key) {
      coords.col = i; // update column to that key
      return true;
    }
  }
  return false;
};

const appendRow = () => {
  if (coords.row >= matrix.length - 1) {
    matrix.push([" "]);
    incrementRow();
  } else {
    matrix.splice(coords.row + 1, 0, [" "]); // splice meaning append to coords.row, delete 0, append new matrix
    incrementRow();
  }
  coords.col = 0;
};

const appendRowBackwards = () => {
  if (coords.row === 0) {
    matrix.unshift([" "]);
    decrementRow();
  } else {
    matrix.splice(coords.row, 0, [" "]); // splice meaning append to coords.row, delete 0, append new matrix
  }
  coords.col = 0;
};

const changeToLastCol = () => {
  coords.col = matrix[coords.row].length - 1;
};

const changeToFirstCol = () => {
  coords.col = 0;
};

const changeToLastRow = () => {
  coords.row = matrix.length - 1;
};

const changeToFirstRow = () => {
  coords.row = 0;
};

const writeText = (key) => {
  matrix[coords.row].splice(coords.col++, 0, key);
};

const search = () => {
  let searchRegex = /foobar123/;
  try {
    searchRegex = new RegExp(searchArr.join(""), "i");
  } catch (error) {
    console.log("regular expression error below, user related, not code");
    console.log(error);
  }
  for (let i = 0; i < matrix.length; i++) {
    const str = matrix[i].join("");
    if (searchRegex.test(str)) {
      const start = str.search(searchRegex);
      const end = start + searchRegex.source.length;
      // searchCoords[i] = { start: start, end: end - 1, row: i }; // push start and end indexes, then row no
      searchCoords.push({ start: start, end: end - 1, row: i }); // push start and end indexes, then row no
    }
  }
  renderSearch();
};

const renderSearch = () => {
  if (currentState !== states.search) {
    command.innerHTML = "";
    return;
  }
  command.innerHTML = "/" + searchArr.join("");
};

const movew = () => {
  for (let i = coords.col; i < matrix[coords.row].length; i++) {
    if (matrix[coords.row][i] === " " && i <= matrix[coords.row].length) {
      coords.col = i + 1;
      coords.col = i + 1 < matrix[coords.row].length ? i + 1 : i;
      return true;
    }
  }
  return false;
};

const moveb = () => {
  for (let i = coords.col; i >= 0; i--) {
    if (matrix[coords.row][i] === " " && i > 0) {
      for (let j = i - 1; j >= 0; j--) {
        if (matrix[coords.row][j] === " ") {
          coords.col = j + 1;
          return true;
        }
      }
      coords.col = 0;
      return true;
    }
  }
  return false;
};

const movee = () => {
};

const updateVisualCoordinates = () => {
  if (!capitalV) visualcoords.to.col = coords.col;
  visualcoords.to.row = coords.row;
};

const inRange = (x, from, to) => {
  if (from > to) {
    return x <= from && x >= to;
  } else {
    return x <= to && x >= from;
  }
};

const deleteVisualRange = () => {
  const mincol = Math.min(visualcoords.from.col, visualcoords.to.col);
  const maxcol = Math.max(visualcoords.from.col, visualcoords.to.col);
  const minrow = Math.min(visualcoords.from.row, visualcoords.to.row);
  const maxrow = Math.max(visualcoords.from.row, visualcoords.to.row);
  if (capitalV) {
    capitalV = false;
  }
  vimcopybuffer = matrix.splice(minrow, maxrow - minrow + 1); // this could have multiple lines
  coords.col = 0;
  coords.row = minrow;
  if (matrix.length === 0) {
    matrix = [[" "]];
    coords.row = 0;
    coords.col = 0;
  }
  if (matrix[coords.row] === undefined) coords.row--;
};

const deleteInRange = (start, end) => {
  vimcopybuffer = matrix[coords.row].splice(start, end - start);
};

const yankVisualRange = () => {
  currentlyHighlighting = false;
  const mincol = Math.min(visualcoords.from.col, visualcoords.to.col);
  const maxcol = Math.max(visualcoords.from.col, visualcoords.to.col);
  const minrow = Math.min(visualcoords.from.row, visualcoords.to.row);
  const maxrow = Math.max(visualcoords.from.row, visualcoords.to.row);
  if (capitalV) {
    capitalV = false;
  }
  vimcopybuffer = [matrix.slice(minrow, maxrow - minrow + 1)];
};

const pasteBuffer = () => {
  const originalrow = coords.row;
  const originalcol = coords.col;
  for (line of vimcopybuffer) {
    for (c of line) {
      appendText(c);
    }
    if (coords.row === matrix.length) appendRow();
    incrementRow();
    coords.col = 0;
  }
  coords.row = originalrow;
};

const appendText = (key) => {
  matrix[coords.row].splice(coords.col++, 0, key);
};

const diw = () => {
  let start;
  let end;
  for (let i = coords.col; i < matrix[coords.row].length; i++) {
    if (matrix[coords.row][i] === " ") {
      end = i;
      break;
    }
  }
  for (let i = coords.col - 1; i >= 0; i--) { // iterate over the lesser
    if (matrix[coords.row][i] === " ") {
      start = i + 1;
      break;
    }
  }
  if (start === undefined) start = 0;
  if (end === undefined) end = coords[coords.row].length - 1;
  deleteInRange(start, end);
  coords.col = start;
};

const ciw = () => {
  diw();
  currentState = states.insert; // delete in word then switch to insert mode
};

const deleteLine = () => {
  vimcopybuffer = matrix.splice(coords.row, 1);
  if (matrix[coords.row] === undefined) coords.row--;
  if (matrix.length === 0) {
    matrix = [[" "]];
    coords.row = 0;
    coords.col = 0;
  }
};

const emulateKeys = (keys) => {
  for (key of keys) {
    rapid({
      key: key,
      ctrlKey: false,
    });
  }
};

const updateLineNumber = () => {
  if (prevcol > matrix[coords.row].length) {
    coords.col = matrix[coords.row].length - 1;
  } else {
    coords.col = prevcol;
  }
};

const updateFileName = () => {
  document.getElementById(currentFilename + "_file").style.backgroundColor =
    canvas.whitetransparent;
  // document.getElementById(currentFilename + "_file").innerText = "  " + currentFilename + "  ";
};

const updatePrevCol = () => {
  prevcol = coords.col; // called when moving horizontally
};

const scrollDown = (lines) => {
};

const ctrlBack = () => {
  let count = 0;
  for (let i = coords.col; i >= 0; i--) {
    if (matrix[coords.row][i] === " " && i < coords.col - 1) {
      matrix[coords.row].splice(i + 1, count - 1);
      coords.col -= count - 1;
      return;
    } else {
      count++;
    }
  }
  coords.col = 0;
  matrix[coords.row] = [" "];
};

const createFileButton = (name) => {
  const span = document.getElementById("filename").cloneNode(true);
  span.id = name + "_file"; // no overlaps
  span.innerText = "  " + name + "  ";
  span.style.position = "relative";
  span.style.height = "100%";
  span.style.verticalAlign = "middle";
  span.style.cursor = "pointer";
  span.addEventListener("click", () => {
    matrix = filemap[name];
    if (matrix.length === 0) {
      matrix = [[" "]];
      filemap[name] = [[" "]];
    }
    unhighlightTab();
    currentFilename = name;
    updateFileName();
    renderText();
  });
  filebar.appendChild(span);
};
createFileButton(currentFilename);
updateFileName();

const unhighlightTab = () => {
  document.getElementById(currentFilename + "_file").style.backgroundColor =
    "transparent";
};

const motionInChar = (char, motion) => {
  if (/[()\[\]{}"']/.test(char) === false) return;
  const arr = [];
  const chararr = [];

  for (let i = coords.col; i < matrix[coords.row].length; i++) {
    if (
      matrix[coords.row][i] === char || matrix[coords.row][i] === startmap[char]
    ) {
      arr.push(i);
      chararr.push(matrix[coords.row][i]);
      if (arr.length === 2) {
        if (chararr[0] === endmap[chararr[1]]) {
          motionInRange(motion, arr[0] + 1, arr[1]);
          coords.col = arr[0] + 1;
          return;
        }
      }
    }
  }
  if (arr.length === 0) return;
  for (let i = coords.col - 1; i >= 0; i--) {
    if (
      matrix[coords.row][i] === char || matrix[coords.row][i] === startmap[char]
    ) {
      arr.unshift(i); // since it's going backwards
      chararr.unshift(matrix[coords.row][i]);
      if (arr.length === 2) {
        if (chararr[0] === endmap[chararr[1]]) {
          motionInRange(motion, arr[0] + 1, arr[1]);
          coords.col = arr[0] + 1;
          return;
        }
      }
    }
  }
  currentState = states.normal;
};

const motionInRange = (motion, start, end) => {
  if (motion === motions.delete) {
    deleteInRange(start, end);
  } else if (motion === motions.c) {
    deleteInRange(start, end);
    currentState = states.insert;
  }
};

const inBraces = () => {
  return matrix[coords.row][coords.col - 1] === "{" &&
    matrix[coords.row][coords.col] === "}";
};

const peek = () => {
  return matrix[coords.row][coords.col];
};

const pasteFromOS = async () => {
  let buffer = await navigator.clipboard.readText();
  buffer = buffer.split(/\r?\n/).join("\n");
  for (const char of buffer) {
    if (char === "\n") {
      appendRow();
      incrementRow();
    } else {
      appendText(char);
    }
  }
  renderText();
};

const leftArrow = () => {
  if (currentlyHighlighting) {
    const min = Math.min(visualcoords.from.row, visualcoords.to.row);
    const max = Math.max(visualcoords.from.row, visualcoords.to.row);
    for (let i = min; i <= max; i++) {
      for (const j of [0, 1]) {
        if (matrix[i][0] === " " && matrix[i].length > 1) {
          matrix[i].shift();
          decrementCol();
        }
      }
    }
  } else {
    for (i of [0, 1]) {
      if (matrix[coords.row][0] === " " && matrix[coords.row].length > 1) {
        matrix[coords.row].shift();
        decrementCol();
      }
    }
  }
};

const rightArrow = () => {
  if (currentlyHighlighting) {
    const min = Math.min(visualcoords.from.row, visualcoords.to.row);
    const max = Math.max(visualcoords.from.row, visualcoords.to.row);
    for (let i = min; i <= max; i++) {
      matrix[i].unshift(" ", " ");
    }
  } else {
    matrix[coords.row].unshift(" ", " ");
  }
};

const cachedump = () => { // dump to local storage
  save();
  for (filename in filemap) {
    localStorage[filename + "_file"] = filemap[filename];
  }
};

const loadcache = () => { // iterate over _file in localstorage and write to filemap
  for (const filename in localStorage) {
    if (filename.includes("_file")) {
      const mapName = filename.replaceAll("_file", "");
      filemap[mapName] = localStorage[filename];
    }
  }
};

const copyMatrixToOS = () => {
  let str = "";
  for (const row of matrix) {
    for (const char of row) {
      str += char;
    }
    str += "\n";
  }
  navigator.clipboard.writeText(str);
};

const copyInHighlightedRange = () => {
  let str = "";
  const minrow = Math.min(visualcoords.to.row, visualcoords.from.row);
  const maxrow = Math.max(visualcoords.to.row, visualcoords.from.row);
  const mincol = Math.min(visualcoords.to.col, visualcoords.from.col);
  const maxcol = Math.max(visualcoords.to.col, visualcoords.from.col);
  if (capitalV) {
    for (let i = minrow; i <= maxrow; i++) {
      for (const char of matrix[i]) {
        str += char;
      }
      str += "\n";
    }
  } else {
    // trickier
  }
  navigator.clipboard.writeText(str);
};

/* similar to telescope, going to be a fuzzy find interactive centered box */
const scope = () => {
  // scopeElement.style.display = "block";
  let scopeStr = "<div style='width:45%;height:90%;display:flex;flex-direction:column;margin-left:2%;margin-top:2%;'>";
  scopeStr += "<div style='height:10%;border:2px solid white;border-radius:7px;'>searchbar</div>";
  scopeStr += "<div style='margin-top:3%;height:80%;border:2px solid white;border-radius:7px;'>bottombar</div></div>";
  scopeStr += "<div style='width:45%;height:90%;border:2px solid white;border-radius:7px;margin-left:2%;margin-top:2%;'>right</div>";
  scopeElement.innerHTML = scopeStr;
  console.log("test");
};
scope();
const toggleScope = () => { 
  if(scopeToggled)
    scopeElement.style.display = "none";
  else
    scopeElement.style.display = "flex";
  scopeToggled = !scopeToggled;
};
