const p2p_port = process.env.P2P_PORT || 6001

const WebSocket = require("ws");
const { WebSocketServer } = require("ws");
const { getLastBlock, getBlocks, createHash } = require("./chainedBlock");
const { addBlock } = require("./checkValidBock");

function initP2PServer(test) {
  const server = new WebSocketServer({ port:test });
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
  sockets.push(ws);
	initMessageHandler(ws);
  initErrorHandler(ws);
}

function getSockets() {
  return sockets;
}

function write(ws, message) {
  ws.send(JSON.stringify(message));
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
			const ws = new WebSocket(peer);
			console.log(ws);
			ws.on("open", ()=>{ 
        console.log("open"); 
        initConnection(ws);
      });
			ws.on("error", (errorType)=>{ console.log("connetion Failed!" + errorType)});
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
    const message = JSON.parse(data);

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

function handleBlockResponse(message) {
  const receiveBlocks = JSON.parse(message.data);
  const latestReceiveBlock = receiveBlocks[receiveBlocks.length -1];
  const latesMyBlock = getLastBlock();

  // 데이터로 받은 블록 중에 마지막 블록의 인덱스가 내가 보유 중인 마지막 블럭의 인덱스보다 클 때/작을 때
  if (latestReceiveBlock.header.index > latesMyBlock.header.index) {
    // 받은 마지막 블록의 이전 해시값이 내 마지막 블럭일 때
    if (createHash(latesMyBlock) === latestReceiveBlock.header.previousHash) {
      if (addBlock(latestReceiveBlock)) {
        broadcast(responseLatestMsg());
      }
      else {
        console.log("Invalid Block!!");
      }
    } else if (receiveBlocks.length === 1) {  // 받은 블럭의 전체 크기가 1일 때
      broadcast(queryAllMsg());
    } else {  // 내 원장이랑 다른 원장 간의 불일치 -> 나중에 해결한다.
      replaceChin(receiveBlocks);
    }
  } else {
    console.log("Do nothing.");
  }
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

function initErrorHandler(ws) {
  ws.on("close", () => { closeConnection(ws); });
  ws.on("error", () => { closeConnection(ws); });
}

function closeConnection(ws) {
  console.log(`Connection close ${ws.url}`);
  sockets.splice(sockets.indexOf(ws), 1);
}

module.exports = {
  connectToPeers,
  getSockets
}