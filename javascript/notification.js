const REMOVETIME = 5000; // display for 5 seconds
//🛈 info char ⓧ x char ⚠ warning char
const notifDiv = document.getElementById("notification");
const styleMessage = (string, color) => {
  const node = document.createElement("div");
  node.style = "color:" + color + ";white-space:pre-wrap;max-width:200px;overflow-wrap:break-word;margin:3px;z-index:10;border:2px solid " + color + ";border-radius: 5px;padding:5px;background-color:" + currentTheme.background + ";";
  node.innerText = string;
  return node;
}

const notif = (string) => { sendNotification(string, "white"); }
const notifSuccess = (string) => { sendNotification(string, canvas.success); }
const notifWarning = (string) => { sendNotification("⚠ " + string, canvas.warning); }
const notifErr = (string) => { sendNotification("ⓧ " + string, canvas.error); }

const sendNotification = (message, color) => {
  notifDiv.appendChild(styleMessage(message, color));
  setTimeout(() => { // [1,2,3], 5 seconds pass, [2,3]
    removeMessage();
  }, REMOVETIME);
}

const removeMessage = () => {
  notifDiv.removeChild(notifDiv.getElementsByTagName("div")[0]); // remove first item?
}
