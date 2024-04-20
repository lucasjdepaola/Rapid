/* relating to keypresses on the status bar, keys pressed, keys per minute, and words per minute via the standard 5 keys per word */

let keybufferIntervalID;
const keyBufferInterval = () => {
  const INTERVALTIME = 50;
  keybufferIntervalID = setInterval(() => {
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

let keysPressed = 0;
let isDisplayingWPM = false;

// TODO make a toggle function (hard to untoggle intervals)
const initWPM = () => {
  isDisplayingWPM = !isDisplayingWPM;
  if (isDisplayingWPM) {
    wpmInterval();
  } else {
    document.getElementById("wpm").innerText = ""; // clear inner text so you don't see "WPM:" frozen on screen
    clearInterval(wpmIntervalID); // if user wants to toggle it
  }
}

let wpmIntervalID;
const wpmInterval = () => {
  wpmIntervalID = setInterval(() => {
    displayWPM();
    keysPressed = 0;
  }, 1000); // on a second interval
}

const wpmCalc = () => { // on a second interval
  return keysPressed / 5 * 60;
}

const displayWPM = () => {
  document.getElementById("wpm").innerText = "WPM: " + wpmCalc();
}
