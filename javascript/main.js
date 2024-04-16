// TODO local html file preview inside of an iframe
// TODO notification system like alpha
// TODO fix auto tab
console.log(JSTree);
const leaderKey = " ";
const text = document.getElementById("text");
const userFolder = document.getElementById("userfolder")
const bg = document.getElementById("bg");
const command = document.getElementById("command");
const bottombar = document.getElementById("bottombar"); // bottom ui bar
let matrix = [[" "]];
let filemap = {}; // keep track of all files
let realFileMap = {}; // for actual files
let userfiles;
let currentFilename = "Untitled";
let lastCursorPos = { x: 0, y: 0 };
let smartLine = false;
const keys =
  "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()";
const states = {
  "insert": "INSERT",
  "normal": "NORMAL",
  "visual": "VISUAL",
  "awaitKey": "AWAITKEY",
  "search": "SEARCH",
  "command": "COMMAND",
  "scope": "SCOPE",
};

const cursors = {
  "block": "BLOCK",
  "underscore": "UNDERSCORE",
  "half": "HALF",
  "insert": "INSERT",
}
let currentCursor = cursors.block;
let currentlyHighlighting = false;
let capitalV = false;
let vimcopybuffer = ""; // this is what keeps track of the vim buffer when yanking or deleting
let buildAwaitStr = ""; // to build the entire motion, such as fa, diw, ciw, d$
let lastAwait = ""; // for '.' in normal mode
let searchArr = [];
let searchCoords = [];
let commentStyle = "//"; // for now, can make dynamic
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
  highlightyellow: "rgba(252, 221, 57, 1)",
  highlightorange: "rgba(240, 136, 62, 1)",
  vimgrey: "#30363d",
  visualpurple: "#5a24b1",
  insertblue: "#0b9dff",
  orangeprogress: "#ffa657",
  normalColor: "#ffa657",
  smartColor: "#ffa657",
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
  coolhackergif: "https://i.pinimg.com/originals/8b/e4/ef/8be4efc0a8e5bc4903aae00db82cb982.gif"
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
const wordBreakRegex = / ."\[\]\(\)!@#$%\^&\*/
let autoTab = "";
const TABWIDTH = "  ";
const scopeElement = document.getElementById("scope");
let scopeToggled = false;
let scopeStr = "";
let gameState = false; // might need to be higher
let correctMatrix;
let deleteHighlight = {
  color: "red",
  arr: [], // arr of coords
}
let changeHighlight = {
  color: "yellow",
  arr: [],
}
let appendHighlight = {
  color: "green", // change to palatte
}
const gameModeTable = {
  vertical: [["x", " "]] // unshift arrays of rand height
}
let chart = {
  PAGESIZE: 50, // 50 is good enough to have some overlap (not the exact page size)
  start: undefined,
  end: undefined,
}
const unsafeMap = { // this is for user inputting html tags, XSS doesn't really matter, but displaying characters properly does
  "&": "&amp",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const XSSRegex = /[<>'"&]/; // regex to detect unsafe characters
let smooth = false;
let isSyntaxHighlighting = true;
const stopDeleteRegex = /[ \[\]\(\)"'{}\.\-=\+,]/;

const assertExploring = () => { exploring = currentFilename === "Explore" };

const rapid = (key, isEmulating) => {
  console.time("test");
  /* cases for alt key, control key, backspace, etc */
  assertExploring();
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
        matrix[coords.row].unshift(...autoTab.split(""));
        coords.col = autoTab.length;
      } else if (currentState === states.search) {
        nKey = true;
        if (searchCoords.length < 1) {
          setNormal();
          searchArr = [];
          renderSearch();
          return;
        }
        coords.row = searchCoords[0].row;
        coords.col = searchCoords[0].start;
        setNormal();
        // searchArr = []; // dont keep this, we want searches to stay on a successful case
        renderSearch();
        // TODO find function that sets cursor to the first highlight
      }
      else if (currentState === states.scope) {
        //bandaid TODO
        interpretCommand("e " + priorityStr);
        toggleScope();
        priorityStr = "";
      }
      else if (currentState === states.normal && currentlyHighlighting) {
        browserSearch(getHighlightedText());
      }
      else if (exploring) {
        select(workingDirectory[coords.row]); // we select the array based on what row the user is on
      }
      else {
        interpretCommand();
      }
    }
    else if (key.key === "Tab") {
      key.preventDefault();
      if (currentState === states.insert) {
        for (let i = 0; i < TABWIDTH.length; i++) {
          appendText(" ");
        }
      }
    }
    else if (key.key === "Escape") {
      setNormal();
      scopestate = false;
      clearAwait();
    } else if (key.key === "Backspace") {
      if (key.ctrlKey) {
        ctrlBack();
      } else if (currentState === states.command) {
        commandArr.pop();
        if (commandArr.length === 0) {
          setNormal();
          renderCommand();
        }
      } else if (currentState === states.search) {
        searchArr.pop();
        if (searchArr.length === 0) {
          setNormal();
        }
        search();
      } else if (currentState === states.insert) {
        delBackspace();
      }
      else if (currentState === states.scope) {
        const scopear = scopeStr.split("");
        scopear.pop();
        scopeStr = scopear.join("");
        appendSearchScopeText("");
        updateScope();
      }
    }
  } else {
    /* regular key case */
    if (currentState === states.normal) { //norm()
      if (key.key === "j") {
        if (coords.row < matrix.length - 1) {
          incrementRow();
          updateLineNumber();
        }
      }
      else if (/[1-9]/.test(key.key)) {
        /* numbers case */
        buildAwaitStr += key.key;
        setAwait();
      }
      else if (key.key === "J") {
        for (let i = 0; i < 10; i++) {
          incrementRow();
        }
      }
      else if (key.key === "k") {
        if (coords.row > 0) {
          decrementRow();
          updateLineNumber();
        }
      }
      else if (key.key === "K") {
        for (let i = 0; i < 10; i++) {
          decrementRow();
        }
      }
      else if (key.key === "h") {
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
        setAwait();
        currentCursor = cursors.underscore;
      } else if (key.key === "s") {
        del(1);
        currentState = states.insert;
      } else if (key.key === "f") {
        if (key.ctrlKey) {
          key.preventDefault();
          toggleScope();
        } else {
          setAwait();
          buildAwaitStr += "f";
        }
      } else if (key.key === "t") {
        setAwait();
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
        if (key.ctrlKey) {
          key.preventDefault();
          Explore(dirHandle); // ctrl E is going to explore
        } else movee();
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
          setAwait();
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
          setAwait();
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
          if (searchIndex < searchCoords.length - 1) searchIndex++;
          coords.row = searchCoords[searchIndex].row;
          coords.col = searchCoords[searchIndex].start;
        }
      } else if (key.key === "N") {
        if (searchIndex < searchCoords.length - 1) searchIndex--;
        coords.row = searchCoords[searchIndex].row;
        coords.col = searchCoords[searchIndex].start;
      }
      else if (key.key === "g") {
        buildAwaitStr = "g";
        setAwait();
      }
      else if (key.key === leaderKey) {
        buildAwaitStr = " ";
        setAwait();
      }
      else if (key.key === "C") {
        deleteInRange(coords.col, matrix[coords.row].length - 1);
        currentState = states.insert;
      }
      else if (key.key === "D") {
        deleteInRange(coords.col, matrix[coords.row].length - 1);
      }
      else if (key.key === ".") {// last command
        emulateKeys(lastAwait);
      }
      else if (key.key === "q") {
        quitAllDivs();
        if (exploring) {
          exploring = false;
        }
      }
    } else if (currentState === states.insert) { // insert()
      /* append letter to the current row and column which increments */
      if (key.ctrlKey) {
        if (key.key === "c") {
          setNormal();
        } else if (key.key === "v") {
          pasteFromOS();
        } else if (key.key === "y") {
          if (currentlyHighlighting) {
            copyInHighlightedRange();
          } else {
            copyMatrixToOS();
          }
        } else if (key.key === "f") {
          scopeStr = "";
          key.preventDefault();
          toggleScope();
          updateScope();
          appendSearchScopeText("");
        }
      } else if (key.key === "j") {
        buildAwaitStr = "j";
        appendText(key.key);
      } else if (buildAwaitStr === "j") {
        if (key.key === "k") {
          setNormal();
          decrementCol();
          del(1);
        }
        else if (key.key === "s") {
          decrementCol();
          del(1);
          appendStringAsText('console.log("line ' + coords.row + '" + );');
          coords.col -= 2; // go back in paren
          clearAwait();
        }
        else if (key.key === "c") {
          decrementCol();
          del(1);
          appendStringAsText('printf("line ' + coords.row + ' ");');
          coords.col -= 3; // go back in paren
          clearAwait();
        }
        else if (key.key === "v") {
          decrementCol();
          del(1);
          appendStringAsText('System.out.println("line ' + coords.row + '" + );');
          coords.col -= 2; // go back in paren
          clearAwait();
        }
        else if (key.key === "p") {
          decrementCol();
          del(1);
          appendStringAsText('print("line ' + coords.row + '" + );');
          coords.col -= 2; // go back in paren
          clearAwait();
        }
        else {
          appendText(key.key);
        }
        let temp = lastAwait;
        clearAwait();
        lastAwait = temp;
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
        buildAwaitStr += key.key;
        setFind(key.key);
        setNormal();
        clearAwait();
      }
      else if (buildAwaitStr === "t") {
        buildAwaitStr += key.key;
        if (setFind(key.key)) {
          coords.col--; // t means before or to
        }
        setNormal();
        clearAwait();
      } else if (buildAwaitStr === "r") {
        buildAwaitStr += key.key;
        replaceChar(key.key);
        setNormal();
        clearAwait();
      } else if (
        buildAwaitStr === "c" || buildAwaitStr === "d" || buildAwaitStr === "y"
      ) {
        if (
          key.key === "i" || key.key === "a" || key.key === "f" ||
          key.key === "t"
        ) {
          buildAwaitStr += key.key;
        } else if (key.key === "d") {
          buildAwaitStr += key.key;
          deleteLine();
          clearAwait();
          setNormal();
        } else if (key.key === "c") {
          buildAwaitStr += key.key;
          deleteLine();
          clearAwait();
          currentState = states.insert;
        }
        else if (key.key === "k") {
          buildAwaitStr += "k";
          if (buildAwaitStr === "dk") {
            deleteRowAndAbove();
            setNormal();
          } else if (buildAwaitStr === "ck") {
            //ck
            buildAwaitStr += key.key;
            deleteRowAndAbove();
            currentState = states.insert;
          }
          clearAwait();
        }
        else if (key.key === "j") {
          buildAwaitStr += "j";
          if (buildAwaitStr === "dj") {
            deleteRowAndBelow();
            setNormal();
          } else {
            // cj
            deleteRowAndBelow();
            currentState = states.insert;
          }
          clearAwait();
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
            clearAwait();
            setNormal();
          } else if (buildAwaitStr === "ciw") {
            ciw();
            clearAwait();
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
            clearAwait();
          }
        }
      }
      else if (/[ycd][ft]/.test(buildAwaitStr)) {
        if (buildAwaitStr === "df") {
          deleteFind(key.key);
          setNormal();
        }
        else if (buildAwaitStr === "cf") {
          deleteFind(key.key);
          currentState = states.insert;
        }
        else if (buildAwaitStr === "yf") {
          deleteFind(key.key);
          setNormal();
        }
        else if (buildAwaitStr === "dt") {
          deleteTo(key.key);
          setNormal();
        }
        else if (buildAwaitStr === "ct") {
          deleteTo(key.key);
          currentState = states.insert;
        }
        else if (buildAwaitStr === "yt") {
          deleteTo(key.key);
          setNormal();
        }
        else setNormal(); // incase hanging
        clearAwait();
      }
      else if (buildAwaitStr === leaderKey) {
        if (key.key === "w") {
          // save TODO interpretcommand(string) so commands can be bound
          saveRealFile(currentFilename);
          setNormal();
          clearAwait();
        }
        else if (key.key === "/") {
          //uncomment/comment lines
          toggleComment();
          setNormal();
          clearAwait();
        }
        // else if(key.key === "")
      }
      else if (buildAwaitStr === "g") {
        if (key.key === "g") {
          coords.row = 0;
          clearAwait();
          setNormal();
        }
      }
      else if (/[1-9]/.test(buildAwaitStr)) {
        if (/[0-9]/.test(key.key)) {
          buildAwaitStr += key.key
        } else {
          let num = parseInt(buildAwaitStr);
          if (num > 10000) num = 10000; // not too high now
          clearAwait();
          setNormal();
          for (let i = 0; i < num; i++) {
            rapid(key, true);
          }
        }
      }
      else {
        setNormal(); // return to normal it is not in constraint
        clearAwait();
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
    } else if (currentState === states.scope) {
      // scopestate() state
      if (key.key > 1) {
        // enter or tab or backspace
        if (key.key === "Backspace") {
        }
      } else {
        if (key.ctrlKey) {
          if (key.key === "f") {
            scopeStr = "";
            key.preventDefault();
            toggleScope();
            updateScope();
            appendSearchScopeText("");
          }
        } else {
          appendSearchScopeText(key.key);
          updateScope();
        }
      }
    }
  }
  if (isSyntaxHighlighting)
    syntaxHighlightFile();
  if (currentlyHighlighting) updateVisualCoordinates();
  updateCol();
  updateBar();
  if (isEmulating === undefined) renderText();
  if (currentState === states.command) {
    renderCommand();
  }
  if (gameState) checkGame();
  if (keyBufferIsOn && isEmulating === undefined) keyBuffer(key);
  console.timeEnd("test");
};

const importRealFile = async (fileHandler) => {
  const file = await fileHandler.getFile();
  let newmatrix = await file.text();
  newmatrix = newmatrix.split(/\r?\n/);
  for (let i = 0; i < newmatrix.length; i++) {
    newmatrix[i] = newmatrix[i].split("");
    newmatrix[i].push(" ");
  }
  matrix = newmatrix;
  filemap[file.name] = newmatrix;
  unhighlightTab(currentFilename);
  currentFilename = file.name;
  createFileButton(currentFilename);
  updateFileName();
  coords.col = 0;
  coords.row = 0;
  renderText();
}
let dirHandle;
userFolder.addEventListener("click", async () => {
  pickFiles();
});

const pickFiles = async () => {
  filemap = {};
  const options = {
    mode: "readwrite"
  };
  dirHandle = await window.showDirectoryPicker(options);
  //TODO make recursive for recursive directories
  for await (const entry of dirHandle.values()) {
    if (entry.kind === "file") {
      //handle file
      realFileMap[entry.name] = entry;
      await importRealFile(entry);
    }
    else if (entry.kind === "directory") {
    }
  }
}

const getSubFiles = async (dirHandle) => {
  let file = { name: "", filehandle: "" };
  const filearr = [];
  for await (const entry of dirHandle.values()) {
    if (entry.kind === "file") {
      //handle file
      realFileMap[entry.name] = entry;
      await importRealFile(entry);
    }
    else if (entry.kind === "directory") {
      getSubFiles(entry, parents + "/" + entry.name);
    }
  }
  return filearr;
}

const lsDirs = async (dirHandle) => {
  const dirs = [];
  for await (const entry of dirHandle.values()) {
    if (entry.kind === "directory") {
      dirs.push(entry);
    }
  }
  return dirs;
}

const ls = async (dirHandle) => {
  if (dirHandle.kind === "file") {
  }
  const dirs = [];
  for await (const entry of dirHandle.values()) {
    if (entry.kind === "directory") {
      dirs.push(entry);
    }
  }

  for await (const entry of dirHandle.values()) {
    if (entry.kind === "file") {
      dirs.push(entry);
    }
  }
  return dirs;
}

const lsRecursive = async (dirHandle) => {
  const dirs = [];
  for await (const entry of dirHandle.values()) {
    if (entry.kind === "directory") {
      dirs.push(entry);
      dirs.push(...lsRecursive(entry)); // recurse
    }
  }
  return dirs;
}

document.addEventListener("keydown", rapid);
document.addEventListener("touchstart", () => {
  document.getElementById("mobile").focus();
});

const interpretCommand = (str) => {
  let cmdstr = commandArr.join("").trim();
  if (str !== undefined) cmdstr = str;
  setNormal();
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
    } else {
      saveRealFile(currentFilename);
    }
  } else if (splitcmd[0] === "background") {
    if (media[splitcmd[1]] !== undefined) {
      bg.style.backgroundImage = "url(" + media[splitcmd[1]] + ")";
      // TODO notification system listing backgrounds, for failed commands, echoing, etc
    }
  } else if (cmdstr === "copy") {
    copyMatrixToOS();
  } else if (cmdstr === "scope") {
    toggleScope();
  }
  else if (cmdstr === "buffer") {
    clipTransfer(vimcopybuffer);
  }
  else if (splitcmd[0] === "replace") {
    // replace here
    replace(splitcmd[1], splitcmd[2]);
  }
  else if (cmdstr === "game") {
    // game here
    game();
  }
  else if (splitcmd[0] === "game") {
    // easy, medium, hard mode will be implemented
  }
  else if (cmdstr === "smooth") {
    initVide();
  }
  else if (cmdstr.toLowerCase() === "explore") {
    Explore(dirHandle); // browser vim files, could be real files based on the directory, which would be more viable
  }
  else if (cmdstr === "source") {
    sourceConfig();
  }
  else if (cmdstr === "file") {
    pickFiles();
  }
  else if (cmdstr === "displaykeys") {
    keyBufferIsOn = !keyBufferIsOn; // toggle
  }
  else if (cmdstr === "smartline") {
    // smart line function to display tiny numbers per char
    smartLine = !smartLine;
  }
  else if (/[0-9]+/.test(cmdstr)) {
    coords.row = parseInt(cmdstr); // if the string is a number, then go to that line number
    if (coords.row >= matrix.length) coords.row = matrix.length - 1; // edge case
  }
  else if (/[0-9].+:[0-9]+/.test(cmdstr)) { // case of it being line:col
    const spl = cmdstr.split(":");
    coords.row = parseInt(spl[0]);
    coords.col = parseInt(spl[1]) - 1; // do we want it to be zero indexed?
    if (coords.row >= matrix.length) coords.row = matrix.length - 1;
    if (coords.col >= matrix[coords.row].length) coords.col = matrix[coords.row].length - 1; // edge cases
  }
  else if (cmdstr === "highlight") {
    isSyntaxHighlighting = !isSyntaxHighlighting; // toggle
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
  if (matrix.length === 1) return;
  const rect = document.getElementById("livecursor");
  const wrapper = document.getElementById("textwrapper");
  const top = rect.offsetTop + (wrapper.offsetTop);
  wrapper.scrollTo(0, top - (window.innerHeight / 2));
};

/* to calculate the offset of a page */
/* this is how to optimize page rendering */
const updateOffsetChart = () => {
  if (matrix.length < chart.PAGESIZE) { // just render the entire page, no optimization
    chart.start = 0;
    chart.end = matrix.length;
  }
  else if (coords.row < chart.PAGESIZE / 2 && matrix.length >= chart.PAGESIZE) { // this is where we have a lot of text, but the cursor is at the top
    // contains err
    chart.start = 0;
    chart.end = coords.row + chart.PAGESIZE;
    if (chart.end > matrix.length) chart.end = matrix.length;
  }
  else if (matrix.length - coords.row < chart.PAGESIZE / 2) { // this means that we can't really center the cursor since it's at the end of the page
    chart.start = matrix.length - 50;
    chart.end = matrix.length;
    if (chart.end > matrix.length) chart.end = matrix.length;
    // centerCursor();
  }
  else {
    // I dont think this case should ever hit
    chart.start = coords.row - chart.PAGESIZE / 2;
    chart.end = coords.row + chart.PAGESIZE / 2;
    // centerCursor();
  }
  if (chart.start < 0 || chart.end > matrix.length) {
  }
  return chart;
}

const updateRenderChar = (char) => {
  let c = char;
  if (XSSRegex.test(char))
    c = unsafeMap[char]; // if it's an unsafe character, replace it with the safe character
  return c;
}

const renderText = () => {
  /* virtual scroll text, using smart optimization to let the cursor always be centered */
  updateLastCursor(); // to create the following animations
  updateOffsetChart(); // get the page offset and coordinate range, we only render 50 lines of code total on the front end
  let lineno = chart.start;
  let htmlstr = "";
  let relativeLine = coords.row - chart.start; // has to be the cursor
  let searchHighlightIndex = 0;
  for (let i = chart.start; i < chart.end; i++) {
    if (i === coords.row) { // if we're on the actual cursor, display a normal line
      htmlstr += Math.abs(lineno) < 10 ? "  " : lineno < 100 ? " " : "";
      htmlstr += "<span style='color:gold;'>" + lineno + "</span>" + "   ";
      htmlstr += "<span style='position:absolute;background-color:rgba(255,255,255,.3);width:100%;z-index:-1;height:1.3em;'></span>"
    } else {
      htmlstr += Math.abs(relativeLine) < 10
        ? "  "
        : relativeLine < 100
          ? " "
          : "";
      htmlstr += Math.abs(relativeLine) + "   ";
    }
    relativeLine--;
    lineno++;
    for (let j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j] !== undefined) {
        let renderChar = updateRenderChar(matrix[i][j]);
        if (coords.row === i && coords.col === j) {
          /* CURSOR CHAR */
          // render it here

          let span = "<span";
          if (currentState === states.insert) {
            span += " id='livecursor' style='border-left: 1px solid white;'";
          } else {
            let cursorStyle = ""
            if (currentCursor === cursors.half) {
              cursorStyle = "background:linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(255,255,255,1) 50%);color:black;";
            }
            else if (currentCursor === cursors.block) {
              cursorStyle = "background-color:white;color:black;";
            }
            else if (currentCursor === cursors.underscore) {
              cursorStyle = "border-bottom: 2px solid white;";
            }
            span +=
              " id='livecursor' style='" + cursorStyle + "'";
          }
          span += ">" + renderChar + "</span>";
          htmlstr += span;
          if (syntaxHighlight.length > 0 && i === syntaxHighlight[0].coords.row && inRange(j, syntaxHighlight[0].coords.from, syntaxHighlight[0].coords.to)) {
            // cursor is on a highlight
            if (j === syntaxHighlight[0].coords.from) {
              let style = "color:" + syntaxHighlight[0].color + ";";
              if ("background" in syntaxHighlight[0]) style += "background-color:" + syntaxHighlight[0].background + ";";
              htmlstr += "<span style=' " + style + "'>";
              if (syntaxHighlight[0].coords.from === syntaxHighlight[0].coords.to) {
                htmlstr += "</span>";
                syntaxHighlight.shift();
              }
            }
            else if (j === syntaxHighlight[0].coords.to) {
              htmlstr += "</span>"; // end the span being created in the state machine
              syntaxHighlight.shift(); // take off the queue if we're at the end of the highlight
            }
          }
          // render cmp here
          if (cmpIsOn && currentState === states.insert) { // insert warrants an auto completion
            const cmp = getCurrCmp();
            // accumList
            const arr = fzfArr(cmp, accumList);
            if (arr !== undefined && arr.length > 0)
              htmlstr += "<span style='position:relative;'><span style='position:absolute;height:100px;width:100px;background-color:black;color:white;'>" + arr.join("\n") + "</span></span>";
          }
        }
        else if (
          currentlyHighlighting && capitalV &&
          inRange(i, visualcoords.from.row, visualcoords.to.row)
        ) { // in visual range
          htmlstr += "<span style='background-color:" + HIGHLIGHTCOLOR + ";'>"; // build inner text
          while (j < matrix[i].length && (coords.row !== i || coords.col !== j)) {
            htmlstr += renderChar;
            renderChar = updateRenderChar(matrix[i][++j]);
          }
          j--;
          htmlstr += "</span>";
        }
        else if (
          currentlyHighlighting &&
          inRange(i, visualcoords.from.row, visualcoords.to.row) &&
          inRange(j, visualcoords.from.col, visualcoords.to.col)
        ) {
          htmlstr += "<span style='background-color:" + HIGHLIGHTCOLOR + ";'>" +
            renderChar + "</span>";
        }
        else if (syntaxHighlight.length > 0 && i === syntaxHighlight[0].coords.row && inRange(j, syntaxHighlight[0].coords.from, syntaxHighlight[0].coords.to)) {
          // highlight char
          if (j === syntaxHighlight[0].coords.from) {
            let style = "color:" + syntaxHighlight[0].color + ";";
            if ("background" in syntaxHighlight[0]) style += "background-color:" + syntaxHighlight[0].background + ";";
            htmlstr += "<span style=' " + style + "'>" + renderChar;
            if (syntaxHighlight[0].coords.from === syntaxHighlight[0].coords.to) {
              // htmlstr += renderChar + "</span>";
              htmlstr += "</span>";
              syntaxHighlight.shift();
            }
          }
          else if (j === syntaxHighlight[0].coords.to) {
            htmlstr += renderChar + "</span>"; // end the span being created in the state machine
            syntaxHighlight.shift(); // take off the queue if we're at the end of the highlight
          } else {
            htmlstr += renderChar;
          }
        }
        else if (
          searchCoords.length > 0 &&
          (currentState === states.search || nKey) &&
          searchCoords[searchHighlightIndex] !== undefined &&
          searchCoords[searchHighlightIndex].row === i &&
          j >= searchCoords[searchHighlightIndex].start &&
          j <= searchCoords[searchHighlightIndex].end
        ) { // render search
          htmlstr += "<span style='background-color:" + canvas.highlightyellow +
            ";'>" + renderChar + "</span>";
          if (searchCoords[searchHighlightIndex].end === j) {
            searchHighlightIndex++;
          }
        } else {
          if (smartLine && coords.row === i && coords.col !== j && matrix[i][j] !== " " && j % 2 === 0) {
            // we're in the row, but not cursor
            // SMART()
            const style = "top:70%;left:10%;position:absolute;font-size:10px;color:" + canvas.smartColor + ";";
            // const style = "top:10px;position:relative;font-size:9px;color:" + canvas.smartColor + ";";
            let span = "<span style='position:relative;'>" + renderChar + "<span style='" + style + "'>" + Math.abs(j - coords.col) + "</span></span>";
            htmlstr += span;
          } else {
            htmlstr += renderChar;
          }
        }
      }
    }
    htmlstr += "<br>";
  }
  text.innerHTML = htmlstr;
  if (smooth) {
    dispatchCursor(); // vide render
  }
  /* CREDIT GOES TO  https://github.com/qwreey/dotfiles/blob/master/vscode/trailCursorEffect/index.js
  *  for part of the code for the animation, which also came from the uselessweb website
  *  although, it still took 2 hours to integrate chunks of the code into this site, as it was native to vscode prior
  * */
  // render with id here
  centerCursor();
};

const updateLastCursor = () => {
  let csr = document.getElementById("livecursor");
  if (csr === null) return; // no last cursor
  let rect = csr.getBoundingClientRect();
  lastCursorPos.x = rect.x;
  lastCursorPos.y = rect.y;
}

const dispatchCursor = () => {
  let rect = document.getElementById("livecursor").getBoundingClientRect();
  videHandler.move(rect.x, rect.y);
}

const renderCommand = () => {
  if (currentState !== states.command) {
    command.innerHTML = "";
    return;
  }
  command.innerHTML = "$ " + commandArr.join("") +
    "<span id='livecursor' style='border-left:1px solid white;'> </span>";
};

const del = (num) => {
  if (matrix[coords.row].length === 1) return; // do not delete the space
  for (let i = 0; i < num; i++) {
    matrix[coords.row].splice(coords.col, 1);
  }
};
const delBackspace = () => {
  if (coords.col === 0) {
    if (coords.row !== 0) coords.row--;
  } else {
    const char = matrix[coords.row].splice(--coords.col, 1);
    if (startmap[char] === peek()) {
      // delete this one too
      matrix[coords.row].splice(coords.col, 1);
    }
  }
};

const replaceChar = (key) => {
  matrix[coords.row].splice(coords.col, 1, key);
};

document.addEventListener("click", (coords) => {
}); // TODO implement a click cursor tracker mechanism

document.addEventListener("wheel", (event) => {
  if (event.deltaY > 0) {
    incrementRow();
  } else {
    decrementRow();
  }
  updateLineNumber();
  renderText();
});

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

const updateCol = () => {
  if (matrix[coords.row] === undefined) matrix[coords.row] = [" "];
  if (coords.col > matrix[coords.row].length - 1) coords.col = matrix[coords.row].length - 1;
  if (currentState !== states.insert && coords.col >= matrix[coords.row].length - 1) decrementCol();
}

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
let globarr;
const deleteInRange = (start, end) => {
  vimcopybuffer = [matrix[coords.row].splice(start, end - start)];
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
  vimcopybuffer = matrix.slice(minrow, maxrow - minrow + 1);
};

const pasteBuffer = () => {
  const originalrow = coords.row;
  const originalcol = coords.col;
  for (line of vimcopybuffer) {
    appendRow();
    coords.col = 0;
    for (c of line) {
      appendText(c);
    }
  }
  updateCol();
};

const appendText = (key) => {
  matrix[coords.row].splice(coords.col++, 0, key);
};

const appendStringAsText = (string) => {
  for (const e of string) {
    appendText(e + "");
  }
}

const isStopDelete = (strchar) => { return stopDeleteRegex.test(strchar); };

const diw = () => {
  let start;
  let end;
  for (let i = coords.col; i < matrix[coords.row].length; i++) {
    if (isStopDelete(matrix[coords.row][i])) {
      end = i;
      break;
    }
  }
  for (let i = coords.col - 1; i >= 0; i--) { // iterate over the lesser
    if (isStopDelete(matrix[coords.row][i])) {
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
    }, true);
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
    canvas.vimgrey;
  // document.getElementById(currentFilename + "_file").innerText = "  " + currentFilename + "  ";
  document.getElementById("currentlyediting").innerText = " 📁 " + currentFilename + "   ";
};

const updatePrevCol = () => {
  prevcol = coords.col; // called when moving horizontally
};

const scrollDown = (lines) => {
};

const ctrlBack = () => {
  let count = 0;
  for (let i = coords.col; i >= 0; i--) {
    if (isStopDelete(matrix[coords.row][i]) && i < coords.col - 1) {
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
  if (filemap[name] === undefined) filemap[name] = [[" "]]; // bandaid solution
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
  setNormal();
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

const toggleScope = () => {
  if (scopeToggled) {
    scopeElement.style.display = "none";
    setNormal();
    scopeStr = "";
  } else {
    scopeElement.style.display = "flex";
    currentState = states.scope;
  }
  scopeToggled = !scopeToggled;
};

const appendSearchScopeText = (key) => {
  scopeStr += key;
  document.getElementById("scopesearch").innerHTML = "🔎 " + scopeStr + "<span style='border-left:1px solid white;'></span>";
};

let priorityStr = "";
const updateScope = () => {
  const names = document.getElementById("scopefilenames");
  const output = document.getElementById("scopefileoutput");
  names.innerText = "→";
  const arr = fzf(scopeStr, filemap);
  if (arr.length < 1) return;
  for (const key of arr) {
    names.innerText += " " + key + "\n";
  }
  priorityStr = arr[0];
  let outputstr = "\n";
  for (const row of filemap[arr[0]]) { // first priority of map (top)
    outputstr += " " + row.join("") + "\n";
  }
  output.innerText = outputstr;
}

/* my fuzzy finding function */
const fzf = (string, map) => {
  const a = [];
  if (string === "") {
    for (const key in map) {
      a.push(key);
    }
    return a;
  }
  let num = 0;
  let cache = 0;
  let flag = false;
  for (const key in map) {
    let str = string;
    for (s of string) {
      num = key.toLowerCase().indexOf(s.toLowerCase());
      if (num === -1 || num < cache) {
        flag = true;
      } else {
        str = str.replace(s, "");
      }
    }
    if (!flag) a.push(key);
    flag = false;
  }
  return a;
}

/* similar to telescope, going to be a fuzzy find interactive centered box */
const scope = () => {
  // scopeElement.style.display = "block";
  let scopeStr =
    "<div style='width:45%;height:90%;display:flex;flex-direction:column;margin-left:2%;margin-top:2%;'>";
  scopeStr +=
    "<div id='scopesearch' style='height:10%;border:2px solid white;border-radius:7px;'>🔎 </div>";
  scopeStr +=
    "<div id='scopefilenames' style='margin-top:3%;height:90%;border:2px solid white;border-radius:7px;'></div></div>";
  scopeStr +=
    "<div id='scopefileoutput' style='width:45%;height:90%;border:2px solid white;border-radius:7px;margin-left:2%;margin-top:2%;'>right</div>";
  scopeElement.innerHTML = scopeStr;
  updateScope();
};
scope();

const deleteRowAndBelow = () => {
  vimcopybuffer = matrix.splice(coords.row, 2);
  if (matrix[coords.row] === undefined) coords.row--;
  if (matrix.length === 0) {
    matrix = [[" "]];
    coords.row = 0;
    coords.col = 0;
  }
}

const deleteRowAndAbove = () => {
  vimcopybuffer = matrix.splice(coords.row - 1, 2);
  if (matrix[coords.row] === undefined) coords.row--;
  if (matrix.length === 0) {
    matrix = [[" "]];
    coords.row = 0;
    coords.col = 0;
  }
  updateCol();
}

const setAwait = () => {
  currentState = states.awaitKey;
  currentCursor = cursors.half;
}

const setNormal = () => {
  currentState = states.normal;
  currentCursor = cursors.block;
}

const updateBar = () => {
  checkState();
  updateLineAndCol();
  updatePercent();
}

const updateLineAndCol = () => {
  document.getElementById("currentrow").innerText = "line " + coords.row;
  document.getElementById("currentcol").innerText = " Col " + coords.col;
}

const updatePercent = () => {
  let gradientPercent = Math.floor(coords.row / (matrix.length - 1) * 100);
  if (matrix.length - 1 === 0) gradientPercent = 0;
  let htmlStr = "";
  const style = 'background:linear-gradient(180deg, rgba(0,0,0,0) ' + (100 - gradientPercent) + '%, rgba(255,166,87,1) 0 ' + gradientPercent + '%);';
  htmlStr += "<span style='" + style + "'" + ">  </span>";
  htmlStr += "<span>" + gradientPercent + "%</span>";
  // cursorStyle = "background:linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(255,255,255,1) 50%);color:black;";
  document.getElementById("rowpercent").innerHTML = htmlStr;
}


const checkState = () => {
  if (currentlyHighlighting) {
    document.getElementById("currentstate").innerText = " VISUAL ";
    document.getElementById("currentstate").style.backgroundColor = canvas.visualpurple;
  }
  else if (currentState === states.normal) {
    document.getElementById("currentstate").innerText = " NORMAL ";
    document.getElementById("currentstate").style.backgroundColor = canvas.normalColor;
  }
  else if (currentState === states.insert) {
    document.getElementById("currentstate").innerText = " INSERT ";
    document.getElementById("currentstate").style.backgroundColor = canvas.insertblue;
  }
}

const replace = (string, replaceString) => { // replace globally
  for (let i = 0; i < matrix.length; i++) {
    matrix[i] = matrix[i].join("").replaceAll(string, replaceString).split("");
  }
}

const clipTransfer = () => {
  let str = "";
  for (line of vimcopybuffer) {
    for (c of line) {
      str += c;
    }
    str += "\n";
  }
  clip(str);
  return true;
}

const clip = (text) => {
  navigator.clipboard.writeText(text);
}

const fileToString = (contents) => {
  let str = "";
  for (let i = 0; i < contents.length; i++) {
    // str += contents[i].join("").trim();
    // str += "\n";
    let temp = contents[i].join("");
    temp = temp.replace(/ $/, "\n");
    str += temp;
  }
  return str;
}

const saveRealFile = async (name) => {
  filemap[name] = matrix; // ?
  if (dirHandle === undefined) {
    save(name); // soft save
    return; // no directory
  }
  if (realFileMap[name] === undefined) {
    realFileMap[name] = await dirHandle.getFileHandle(name, { create: true });
  }
  const handler = realFileMap[name];
  const writeable = await handler.createWritable({ type: "write" }); // only works in secure contexts
  const data = fileToString(filemap[name]);
  await writeable.write({ type: "write", data: data });
  await writeable.close();
}

const matrixesAreEqual = (mOne, mTwo) => {
  if (mOne.length !== mTwo.length) return false;
  for (let i = 0; i < mOne.length; i++) {
    if (mOne[i].length !== mTwo[i].length) return false;
    for (let j = 0; j < mOne[i].length; j++) {
      if (mOne[i][j] !== mTwo[i][j]) return false;
    }
  }
  return true;
}

const deleteFind = (key) => {
  let start = coords.col;
  for (let i = start; i < matrix[coords.row].length; i++) {
    if (matrix[coords.row][i] === key) {
      deleteInRange(start, i + 1);
    }
  }
}

const deleteTo = (key) => {
  let start = coords.col;
  for (let i = start; i < matrix[coords.row].length; i++) {
    if (matrix[coords.row][i] === key) {
      deleteInRange(start, i);
    }
  }
}

const rand = (max) => {
  return Math.floor(Math.random() * max) + 1;
}

const start = (gameMatrix) => {
  const RAND = 27;
  /* the size should stay the same, it should be the x changing */
  // matrix.unshift([" "]); // unshift new row
  // correctMatrix.unshift([" "]); 
  let randomNo = rand(RAND);
  while (randomNo === coords.row) randomNo = rand(RAND);
  matrix[randomNo] = gameMatrix[0]; // set gamematrix to a random row
}

const game = () => {
  if (gameState) {
    let gameMatrix = gameModeTable.vertical.slice(0);
    correctMatrix = [[" "]];
    matrix = [[" "]];
    for (let i = 0; i < 27; i++) {
      matrix.push([" "]); // push a new row
      correctMatrix.push([" "]);
    }
    start(gameMatrix);
    return;
  }
  unhighlightTab();
  currentFilename = "game";
  createFileButton("game");
  updateFileName();
  gameState = true;
  let gameMatrix = gameModeTable.vertical.slice(0);
  correctMatrix = [[" "]];
  matrix = [[" "]];
  for (let i = 0; i < 27; i++) {
    matrix.push([" "]); // push a new row
    correctMatrix.push([" "]);
  }
  start(gameMatrix);
}

const checkGame = () => {
  if (matrixesAreEqual(matrix, correctMatrix)) {
    start([["x", " "]]);// restart game
    renderText();
  }
}

const getFileExtension = (fileName) => {
  const _arr = fileName.split(".");
  return _arr[_arr.length - 1];
}

const clearAwait = () => {
  lastAwait = buildAwaitStr;
  buildAwaitStr = "";
}

const toggleComment = () => {
  if (currentlyHighlighting) {
    // for(let i = 0; i < )
  } else {
    if (matrix[coords.row][0] === "/" && matrix[coords.row][1] === "/") {
      matrix[coords.row].splice(0, 2); // delete comment
    } else {
      matrix[coords.row].unshift("/", "/"); // comment
    }
  }
}

let cvs;
let cursorIsInit = false;
const pollingRate = 500;

// heavily inspired from https://github.com/qwreey/dotfiles/blob/master/vscode/trailCursorEffect/index.js
// https://github.com/tholman/cursor-effects the useless web
const createTrail = () => {
  const totalParticles = 4;
  let particlesColor = "white"; // cursor color here
  const style = cursors.block; // can change later
  const context = cvs.getContext("2d");
  let cursor = { x: 0, y: 0 }; // coords here
  let particles = [];
  let width = document.body.clientWidth;
  let height = document.body.clientHeight;
  let sizeX = 9.3;
  // let sizeY = sizeX*2.2;
  let sizeY = 17;
  const updateSize = (x, y) => {
    width = x;
    height = y;
    cvs.width = x;
    cvs.height = y;
  }
  updateSize(width, height);

  class Vec2 {
    constructor(x, y) {
      this.position = { x: x, y: y };
    }
  }

  const addParticle = (x, y, image) => {
    particles.push(new Vec2(x, y, image))
  }

  const calculatePosition = () => {
    let x = cursor.x, y = cursor.y;

    for (const particleIndex in particles) {
      const nextParticlePos = (particles[+particleIndex + 1] || particles[0]).position
      const particlePos = particles[+particleIndex].position

      particlePos.x = x;
      particlePos.y = y;

      x += (nextParticlePos.x - particlePos.x) * 0.42
      y += (nextParticlePos.y - particlePos.y) * 0.35
    }
  }

  const move = (x, y) => {
    x = x + sizeX / 2;
    cursor.x = x;
    cursor.y = y;
    if (cursorIsInit === false) {
      cursorIsInit = true
      for (let i = 0; i < totalParticles; i++) {
        addParticle(x, y);
      }
    }
  }

  const drawLines = () => {
    context.beginPath();
    context.lineJoin = "round";
    context.strokeStyle = particlesColor;
    const lineWidth = Math.min(sizeX, sizeY);
    context.lineWidth = lineWidth;

    let ymut = (sizeY - lineWidth) / 3
    for (let yoffset = 0; yoffset <= 3; yoffset++) {
      let offset = yoffset * ymut
      for (const particleIndex in particles) {
        const pos = particles[particleIndex].position
        if (particleIndex == 0) {
          context.moveTo(pos.x, pos.y + offset + lineWidth / 2)
        } else {
          context.lineTo(pos.x, pos.y + offset + lineWidth / 2)
        }
      }
    }
    context.stroke();
  }

  const updateParticles = () => {
    if (!cursorIsInit) return;
    const rect = document.getElementById("livecursor").getBoundingClientRect();

    context.clearRect(0, 0, width, height);
    calculatePosition();

    if (currentState === states.normal) {
      sizeX = 9.3;
    }
    else if (currentState === states.insert) {
      sizeX = 1;
    }
    drawLines();
  }
  return {
    updateParticles: updateParticles,
    move: move,
    updateSize: updateSize,
  }
}

const updateLoop = () => {
  videHandler.updateParticles();
  requestAnimationFrame(updateLoop)
}

let videHandler;
const initVide = () => {
  // create cursor canvas (prioritized blank canvas that draws cursor animations)
  cvs = document.createElement("canvas");
  cvs.style.position = "absolute";
  cvs.style.pointerEvents = "none";
  cvs.style.top = "0px";
  cvs.style.left = "0px";
  cvs.style.zIndex = "1000";
  document.body.appendChild(cvs);
  videHandler = createTrail();
  smooth = true;
  updateLoop();

}

//useful for visual range commands
const getHighlightedText = () => {
  const minRow = Math.min(visualcoords.from.row, visualcoords.to.row);
  const maxRow = Math.max(visualcoords.from.row, visualcoords.to.row);
  let str = "";
  // row for now
  for (let i = minRow; i <= maxRow; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      str += matrix[i][j];
    }
  }
  return str;
}

const browserInstance = document.getElementById("browserinstance");
const browser = () => {
  //https://www.google.com/search?q=test
  //https://www.google.com/webhp?igu=1


}

/* given a string, return a google link query */
const googleQuery = (str) => {
  // return "https://www.google.com/search?q=" + str.replaceAll(" ", "+");
  return "https://www.google.com/search?q=" + str.replaceAll(" ", "+") + "&igu=1";
}

const browserSearch = (str) => {
  document.getElementById("browserinstance").style.display = "flex";
  let url;
  if (str.includes(".")) {
    url = "https://" + str.trim();
  }
  else {
    url = googleQuery(str);
  }
  document.getElementById("browseriframe").src = url;
}

const quitAllDivs = () => {
  document.getElementById("browserinstance").style.display = "none";
}

let exploring = false;
let workingDirectory;
const Explore = async (dir) => {
  if (dir === undefined) return;
  if (dir.kind === "file") {
    // handle file selection
    importRealFile(dir)
    exploring = false;
  }
  // vim explore
  exploring = true;
  interpretCommand("e Explore"); // go to new file
  if (dirHandle !== undefined) {
    matrix = [[" "]];
    workingDirectory = await ls(dir);
    // TODO fix bug in here
    let hasParent = dir.parent !== undefined;
    if (hasParent) {
      matrix[0] = [".", ".", " "];
      workingDirectory.unshift(dir.parent); // add parent as first
    }
    let count = 0;
    for (const e of workingDirectory) {
      if (count === 0 && hasParent) {
        count++;
        continue;
      }
      e.parent = dir; // asserting that the parent is defined
      for (let i = 0; i < e.name.length; i++) {
        if (matrix[count] === undefined) matrix[count] = [" "];
        matrix[count][i] = e.name[i];
      }
      if (e.kind === "directory") {
        matrix[count].push(..." (directory) ".split(""));
      }
      else {
        matrix[count].push(" ");
      }
      count++;
    }
  }
  renderText();
}

const select = async (fileOrDir) => {
  if (fileOrDir.kind === "file") {
    if (filemap[fileOrDir.name] !== undefined) {
      interpretCommand("e " + fileOrDir.name);
      exploring = false; // stop exploring
    } else {
      importRealFile(fileOrDir);
    }
  } else {
    Explore(fileOrDir); // continue to normal exploring
  }
}

const sourceConfig = () => {
  for (let i = 0; i < matrix.length; i++) {
    interpretCommand(matrix[i].join("").replace(/ $/, ""));
  }
}

const keyBufferInterval = () => {
  // TODO find a way to count seconds down in order to decrement buffer
  const INTERVALTIME = 50;
  setInterval(() => {
    for (let i = 0; i < keyBufferArr.length; i++) {
      if (keyBufferArr[i].time < 0) {// key time is up
        keyBufferArr.splice(i, 1);
      } else {
        keyBufferArr[i].time -= (INTERVALTIME / 1000);
      }
    }
    displayKeys(Math.round(keyBufferArr.length / KEYTIME));
  }, INTERVALTIME);
}

const displayKeys = (kps) => {
  if (keyBufferArr.length <= 1)
    document.getElementById("keybuffer").innerText = "";
  const buffmap = keyBufferArr.map((e) => { return e.key });
  document.getElementById("keybuffer").innerText = "kps:" + kps + ", " + buffmap.join("");
}

/* keybuffer which displays user keypresses for a short amount of time */
/* aims to emulate screenkeys, for better understanding of vim actions */
let keyBufferArr = [];
const KEYTIME = 3; // seconds
let keyBufferIsOn = false; // call function when the buffer is on
let keyBufferIntervalIsOn = false;
const keyBuffer = (key) => {
  if (!keyBufferIsOn) {
    return;
  };
  if (!keyBufferIntervalIsOn) {
    keyBufferInterval();
    keyBufferIntervalIsOn = true;
  }
  let keyStr = key.key;
  if (key.ctrlKey) keyStr = "Ctrl-" + key.key;
  if (key.key === "Shift") {
    return;
  }
  else if (key.key === "Control") return;
  else if (key.key === "Backspace") keyStr = "<backspace>";
  else if (key.key === "Enter") keyStr = "<enter>";
  // assume that key is called for every key press regardless
  keyBufferArr.push({ key: keyStr, time: KEYTIME });
}

renderText();
