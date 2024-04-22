/* load extensions via the web, they don't need to be installed because of how cheap requests are in this case */

const loadExtension = (link) => {
  const script = document.createElement("script");
  script.src = link; // XSS has no purpose in this case, there is no backend for a malicious actor to affect
  document.getElementById("extensions").appendChild(script); // append script to the head
  script.onload(() => {
    console.log("script loaded");
  });
}

const extensionExample = () => {
  /* comment all lines out using the param. Example execution: 'commentall //' will comment all with '//' */
  const commentAll = (commenttype) => {
    for (const row of matrix) {
      row.unshift(...commenttype.split("")); // the matrix is a 2d array of chars, so we cannot push pure strings to it
    }
  }
  validCommands["commentall"] = commentAll;
};
extensionExample();

const runJSExtension = () => {
  const runJS = () => {
    try {
      const str = matrix.map((e) => e.join("")).join("\n");
      eval(str);
    } catch (e) {
      console.error(e);
    }
  }
  validCommands["run"] = runJS; // new command
}
runJSExtension();
