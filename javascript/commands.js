const validCommands = {}; // command to function mapping

const interpretCommand = (str, emulating) => {
  let cmdstr = "";
  if (str !== undefined) cmdstr = str;
  else cmdstr = commandArr.join("").trim();
  setNormal(); // be careful setting normal here
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
  else if (/^[0-9]+$/.test(cmdstr)) {
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
  else if (splitcmd[0] === "notif") {
    notif(cmdstr.replace("notif ", ""));
  }
  else if (splitcmd[0] === "err") {
    notifErr(cmdstr.replace("err ", ""));
  }
  else if (splitcmd[0] === "warn") {
    notifWarning(cmdstr.replace("warn ", ""));
  }
  else if (splitcmd[0] === "theme") {
    if (splitcmd[1] in themeMap) {
      updateTheme(themeMap[splitcmd[1]]);
    }
  }
  else if (cmdstr === "wpm") {
    initWPM();
  }
  else if (splitcmd[0] === "alias") { // delimit with quotes
    const arr = cmdstr.split(/\".*"/);
    aliasCmd(cmdstr.split('\"'));
  }
  else if (cmdstr === "dot") {
    emacsDot = !emacsDot; // toggle emacs dot
  }
  else if (splitcmd[0] in validCommands) {
    const func = validCommands[splitcmd[0]];
    func(cmdstr.split(splitcmd[0]).join("").trim());
  }
  else {
    sendNotification("Could not find command.", canvas.error)
  }
};

const renderCommand = () => {
  if (currentState !== states.command) {
    command.innerHTML = "";
    return;
  }
  command.innerHTML = ":" + commandArr.join("") +
    "<span id='livecursor' style='border-left:1px solid white;'> </span>";
};

let currSearch = "";
let autoCmpIndex = 0;
const autoCompleteCommand = () => {
  const spacesArr = commandArr.join("").split(" ");
  const lastStr = spacesArr[spacesArr.length - 1];
  const filemapNames = [];
  for (const key in filemap) {
    filemapNames.push(key); // name of filemap
  }
  const replaceArr = filemapNames.filter((name) => name.toLowerCase().includes(lastStr.toLowerCase()));
  const replaceStr = replaceArr[autoCmpIndex++];
  if (autoCmpIndex >= replaceArr.length) autoCmpIndex = 0;
  commandArr.splice(commandArr.length - lastStr.length, lastStr.length, ...replaceStr.split(""));
}

/* NOTE: you can create a command (preferably in the extensions directory) via the following syntax */
validCommands["your_command_here"] = (strargs) => {
  // perform a command here, modify the matrix, anything you want
  console.log(strargs);
  // call the command via <ESC>:your_command_here hello<CR>
  // this will print "hello" on the notification queue
}

validCommands["function"] = (javascriptcode) => {
  try {
    eval(javascriptcode);
  } catch (e) {
    console.error(e);
  }
}
