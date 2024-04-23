// going to use a websocket for multiplayer connection


const createRoom = (code) => {
  if (code.length > 5) return notifErr("Cannot create room, please use a code under 5 characters");
  // create websocket with code listed
  const config = {}; // fill config here
  const pc = new RTCPeerConnection();
  return 0;
}
