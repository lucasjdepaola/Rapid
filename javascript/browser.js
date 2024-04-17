/* browser instance while in the editor */
const browserInstance = document.getElementById("browserinstance");

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
