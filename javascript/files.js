/* ideally place all file related functions here */
const userFolder = document.getElementById("userfolder");
const folderText = document.getElementById("foldertext");
const getFileExtension = (fileName) => {
  const _arr = fileName.split(".");
  return _arr[_arr.length - 1];
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

/* change a file name in explore mode, given the newname, and handle */
const changeRealFileNameExplore = (handle, newName) => {
  handle.name = newName; // Hopefully this is possible
}

const findFileExplore = (index, name) => {
}

/* ideally we find all changes with the files, and try to remap the newly created names */
/* can't even imagine how oil does it on edge cases such as the user appending a line, but can try to work around */
/* I think making it a hashmap is a better idea, this is likely how oil does it, otherwise it would be impossible */
/* UPDATE, there is no possible or feasible way to move directories, the only way to move files would be to copy files from one page to another */
/* this is going to be the only possible way to do this now */
const oilExploreSave = () => {
  const map = {}; // create hashmap for oil
  for (let i = 0; i < workingDirectory.length; i++) {
    map[workingDirectory[i].name] = workingDirectory[i]; // name to handle mapping
    console.log(workingDirectory[i].name);
    // all working directories
  }

  const matrixStringArr = [];
  for (let i = 0; i < matrix.length; i++) {
    let matrixFileName = matrix[i].join("");
    matrixFileName = matrixFileName.substring(2, matrixFileName.length - 1).trim();
    matrixStringArr.push(matrixFileName);
  }

  const changedMatrixFiles = []; // changed files
  const dirsNotChanged = [];
  for (let i = 0; i < matrixStringArr.length; i++) {
    if (!matrixStringArr[i] in map) {
      changedMatrixFiles.push(matrixStringArr[i]); // push the changed file (in relative order)
    } else {
      console.log(map[matrixStringArr[i]]);
      console.log(matrixStringArr[i]);
      dirsNotChanged.push(map[matrixStringArr[i]]); // push the non changed directories
    }
  }

  const changedDirs = [];
  for (let i = 0; i < workingDirectory.length; i++) {
    let flag = false;
    for (let j = 0; j < dirsNotChanged.length; j++) {
      console.log(dirsNotChanged[j]);
      if (dirsNotChanged[j].name === workingDirectory[i].name) {
        flag = true;
      }
    }
    if (!flag) changedDirs.push(workingDirectory[i]);
  }
}

const saveRealFile = async (name) => {
  filemap[name] = matrix; // ?
  if (dirHandle === undefined || currentFilename === "Explore") { // on explore we have a special oil.nvim case
    if (currentFilename === "Explore") {
      oilExploreSave();
      return;
    }
    save(name); // soft save
    console.log("saving file not synced to file system");
    return; // no directory
  }
  if (realFileMap[name] === undefined) {
    console.success("Created new file for " + name);
    realFileMap[name] = await dirHandle.getFileHandle(name, { create: true });
  }
  const handler = realFileMap[name];
  const writeable = await handler.createWritable({ type: "write" }); // only works in secure contexts
  const data = fileToString(filemap[name]);
  await writeable.write({ type: "write", data: data });
  await writeable.close();
  console.success("Successfully saved the file to " + name);
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
        matrix[count].unshift("📁", " ");
        // TODO logo map for files like the folder above, html can have an icon, etc
      }
      else {
        const extension = getFileExtension(e.name)
        if (extension in languageMap && "icon" in languageMap[extension]) {
          matrix[count].unshift(languageMap[extension]["icon"], " ")
        }
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
  if (isSyntaxHighlighting) syntaxHighlightFile();
  renderText();
}
let dirHandle;
folderText.addEventListener("click", async () => {
  pickFiles();
});

const pickFiles = async () => {
  filemap = {};
  const options = {
    mode: "readwrite"
  };
  dirHandle = await window.showDirectoryPicker(options);
  console.warn("Warning: you are now editing real files from your file system, text you edit and save here will modify the real file.");
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
