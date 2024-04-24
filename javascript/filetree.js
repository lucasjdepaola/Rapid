const fileTree = document.getElementById("filetree");
let fileTreeIsOn = false;

const toggleTree = () => {
  fileTreeIsOn = !fileTreeIsOn; // toggle boolean
  if (fileTreeIsOn) {
    // display tree
    fileTree.style.display = "flex"; // ?
  } else {
    fileTree.style.display = "none";
  }
}
