/* input a command "chat twitch_user" to view the chat while editing (displays in notifications for now) */

// TODO find functional twitch interface
let hasInjected = false;
const injectTMI = (user) => {
  console.log("injecting");
  if (hasInjected) return getChat(user);
  hasInjected = true;
  const script = document.createElement("script");
  script.src = "https://raw.githubusercontent.com/tmijs/cdn/master/1.4.2/tmi.js";
  document.head.appendChild(script);
  script.onload = () => {
    console.log("loaded");
    getChat(user);
  }
  //inject tmi library for twitch chat, don't inject if not in use
}

const getChat = (user) => {
  console.log("getting chat");
  const client = new tmi.Client({
    channels: [user]
  });
  client.connect();
  client.on('message', (channel, tags, message, self) => {
    console.log("message");
    notifSuccess(message);
  });
}
