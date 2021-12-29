const p2p_port = process.env.P2P_PORT || 6001

const WebSocket = require("ws")
const { WebSocketServer } = require("ws")

function initP2PServer(test) {
  const server = new WebSocketServer({ port:test })
  server.on("connection", (ws) => { 
    console.log(ws);
    initConnection(ws); 
  })
  console.log("Listening webSocket port : " + test);
}

// initP2PServer();
initP2PServer(6001);
initP2PServer(6002);
initP2PServer(6003); 

let sockets = []

function initConnection(ws) {
  sockets.push(ws)
}

function getSockets() {
  return sockets;
}

function write(ws, message) {
  ws.send(JSON.stringify(message))
}

function broadcast(message) {
  sockets.forEach(
    (socket) => {
      write(socket, message);
    }
  )
}

function connectToPeers(newPeers) {
  console.log(newPeers);

  newPeers.forEach(
    (peer) => {  
      console.log(peer);
      const ws = new WebSocket(peer)
      ws.on("open", () => { initConnection(ws) })
      ws.on("error", () => { console.log("connection Failed!"); })
    }
  )
}

module.exports = {
  connectToPeers,
  getSockets
}