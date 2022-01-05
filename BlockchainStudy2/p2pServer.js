const p2p_port = process.env.P2P_PORT || 6001

const WebSocket = require("ws")
const { WebSocketServer } = require("ws")
const { getLastBlock, getBlocks } = require("./chainedBlock")

function initP2PServer(test_port) {
  const server = new WebSocketServer({ port:test_port })
  server.on("connection", (ws) => { 
    console.log(ws);
    initConnection(ws); 
  })
  console.log("Listening webSocket port : " + test_port);
}

// initP2PServer();
initP2PServer(6001);
initP2PServer(6002);
initP2PServer(6003); 

let sockets = []

function initConnection(ws) {
  sockets.push(ws)
	initMessageHandler(ws)
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
		(peer)=>{			
			const ws = new WebSocket(peer)
			console.log(ws);
			ws.on("open", ()=>{ 
        console.log("open"); 
        initConnection(ws);
      })
			ws.on("error", (errorType)=>{ console.log("connetion Failed!" + errorType)})
		}
  )
}

const MessageType = {
  QUERY_LATEST:0,
  QUERY_ALL:1,
  RESPONSE_BLOCKCHAIN:2
}

function initMessageHandler(ws) {
  ws.on("message", (data) => {
    const message = JSON.parse(data)

    switch(message.type) {
      case MessageType.QUERY_LATEST:
        // 내블록중 가장 최근 블록을 반환한다.
        write(ws, responseLatestMsg());
        break;
      case MessageType.QUERY_ALL:
        write(ws, responseAllChainMsg());
        break;
      case MessageType.RESPONSE_BLOCKCHAIN:
        handleBlockResponse(message);
        break;
    }
  })
}

function responseLatestMsg() {
  return ({
    "type": RESPONSE_BLOCKCHAIN,
    "data": JSON.stringify([getLastBlock()])
  })
}

function responseAllChainMsg() {
  return ({
    "type": RESPONSE_BLOCKCHAIN,
    "data": JSON.stringify(getBlocks())
  })
}

function handleBlockResponse() {
  
}

function queryAllMsg() {
  return ({
    "type": QUERY_ALL,
    "data": null
  })
}

function queryLatestMsg() {
  return ({
    "type": QUERY_LATEST,
    "data": null
  })
}

module.exports = {
  connectToPeers,
  getSockets,
  broadcast
}