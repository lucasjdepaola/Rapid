let gameState = false; // might need to be higher
const gameModeTable = {
  vertical: [["x", " "]] // unshift arrays of rand height
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

const start = (gameMatrix) => {
  const RAND = 27;
  /* the size should stay the same, it should be the x changing */
  let randomNo = rand(RAND);
  while (randomNo === coords.row) randomNo = rand(RAND);
  matrix[randomNo] = gameMatrix[0]; // set gamematrix to a random row
}

const checkGame = () => {
  if (matrixesAreEqual(matrix, correctMatrix)) {
    start([["x", " "]]);// restart game
    renderText();
  }
}
