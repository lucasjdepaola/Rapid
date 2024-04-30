const twitchChatExtension = () => {
  const openChat = (username) => {
    const ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    ws.onopen = (event) => {
      console.log("here");
      ws.send("PASS <random_string>");
      ws.send("NICK justinfan123555");
      ws.send("JOIN #" + username);
    }

    ws.onmessage = (message) => {
      console.success("new twitch message received");
      let str = message.data + "";
      const index = str.indexOf("#");
      const newSTr = str.split("").splice(index, str.length - index).join("");
      console.purple(newSTr);

      log(message.data);
    }
    ws.onerror = (err) => {
      console.error(err);
    }
  }

  validCommands["twitch"] = openChat;
}
twitchChatExtension();
