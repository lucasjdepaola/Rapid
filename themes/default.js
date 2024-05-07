const themeCanvas = { // if you want to add an extra color map for visual purposes
  "red": "#ff7b72",
  "purple": "#d2a8ff",
  "numbers": "#79c0ff",
  "quoteBlue": "#a5d6ff",
  "comment": "#737b85",
  "booleanblue": "#79c0ff",
  "background": "#30363d"
};
const defaultTheme = {
  "native": themeCanvas.red,
  "quotes": themeCanvas.quoteBlue,
  "background": themeCanvas.background,
  "text": "white",
  "braces": themeCanvas.purple,
  "function": themeCanvas.purple,
  "numbers": themeCanvas.numbers,
  "comment": themeCanvas.comment,
  "boolean": themeCanvas.booleanblue,
  "fontcolor": "white",
  "barcolor": "#3f4563",
  "highlight": "rgba(255, 255, 255, .3)",
  // "icursor": cursors.block,
  "visualradius": "0px"
};

const hackerTheme = {
  "native": "#3cb241",
  "function": "#226525",
  "quotes": "#a5ff00",
  "background": "black",
  "braces": themeCanvas.purple,
  "numbers": themeCanvas.numbers,
  "comment": themeCanvas.comment,
  "boolean": themeCanvas.booleanblue,
  "fontcolor": "#56ff5e",
  "barcolor": "black",
  "image": "matrix",
}
