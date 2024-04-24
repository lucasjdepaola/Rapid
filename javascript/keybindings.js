const nmap = {
}; // push appropriate keybindings here, if it exists, then it will be changed last second

const aliasCmd = (cmd, desiredCommand) => {
  validCommands[cmd] = interpretAlias.bind(desiredCommand);
}

const interpretAlias = (desiredCommand) => {
  interpretCommand(desiredCommand); // we interpet the command that the user wants as an alias
}
