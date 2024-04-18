let currentTheme = defaultTheme;
const themeMap = {
  "hacker": hackerTheme,
  "default": defaultTheme
};
const updateTheme = (theme) => {
  currentTheme = theme;
  document.body.style.color = currentTheme.fontcolor;
  document.getElementById("text").style.color = currentTheme.fontcolor;
  document.getElementById("topbar").style.backgroundColor = currentTheme.barcolor;
  document.getElementById("bg").style.backgroundImage = "url(" + imagefunc(currentTheme.image) + ")"; //test
}
