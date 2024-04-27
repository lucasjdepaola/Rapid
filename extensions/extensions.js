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

const setFontExtension = () => {
  const setFont = (size) => {
    document.body.style.fontSize = size + "px";
  }
  validCommands["font"] = setFont;
}
setFontExtension(); // to change font size

const configExtension = () => {
  const setConfig = () => {
    let str = "";
    for (const row of matrix) {
      str += row.join("");
      str += "\n";
    }
    localStorage[".rapid"] = str.trim();
    getConfig();
  }

  const getConfig = () => {
    const temprapidarr = localStorage[".rapid"].split("\n");
    filemap[".rapid"] = temprapidarr.map((e) => e.split("")); // split up the characters, so it's not one long string
    if (".rapid" in localStorage) {
      const arr = localStorage[".rapid"].split("\n");
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].length > 1) {
          interpretCommand(arr[i].trim()); // source the commands
        }
      }
      currentState = states.insert;
    } else {
      console.error("You don't have a cached config, source one by creating a .rapid config, then typing 'cache'");
    }
  }
  validCommands["cache"] = setConfig;
  if (".rapid" in localStorage) getConfig(); // source auto cached config
}

const curlExtension = () => {
  const curl = async (javascriptLink) => {
    const url = await fetch(javascriptLink);
    const data = await url.json();
    console.log(data);
  }
  validCommands["curl"] = curl;
  // cannot use this extension due to buffer issues.
}
curlExtension();

const stateExtension = () => {
  const setState = (stateTo) => {
    if (stateTo === states.insert) {
      currentState = states.insert;
    }
    else if (stateTo === states.normal) {
      currentState = states.normal;
    }
  }
  validCommands["state"] = setState;
}
stateExtension();

