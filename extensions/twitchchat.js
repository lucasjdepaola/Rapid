/* twitch extension to track messages from any streamer */
/* use command "twitch user_here" to connect to a streamers chat, have it displayed via the notification extension */
const currentViewing = []; // current streamers the user is viewing
const chatbuffer = [];
const twitchChatExtension = () => {
  const openChat = (username) => {
    const ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    ws.onopen = (event) => {
      ws.send("PASS <random_string>");
      ws.send("NICK justinfan123555");
      ws.send("JOIN #" + username);
      currentViewing.push(username);
    }

    ws.onmessage = (message) => {
      let str = message.data + "";
      const index = str.indexOf("#");
      const newStr = str.split("").splice(index, str.length - index).join("");
      console.purple(newStr);
      log(message.data);
      chatbuffer.push(message.data); // store the chat messages in a temp array (that does not get saved)
    }
    ws.onerror = (err) => {
      console.error(err);
    }
  }

  validCommands["twitch"] = openChat;
}
twitchChatExtension();
