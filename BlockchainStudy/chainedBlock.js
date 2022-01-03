const fs = require('fs')
const merkle = require('merkle')
const cryptojs = require('crypto-js')
const random = require('random')

class Block {
  constructor(header, body) {
    this.header = header
    this.body = body
  }
}

class BlockHeader {
  constructor (version, index, previousHash, timestamp, merkleRoot, difficulty, nonce) {
    this.version = version
    this.index = index
    this.previousHash = previousHash
    this.timestamp = timestamp
    this.merkleRoot = merkleRoot
    this.difficulty = difficulty
    this.nonce = nonce
  }
}

function getVersion() {
  const package = fs.readFileSync("package.json")
  return JSON.parse(package).version
}

function createGenesisBlock() {
  const version = getVersion()
  const index = 0
  const previousHash = '0'.repeat(64)
  const timestamp = 1231006505  // 2009/01/03 6:15pm (UTC)
  const body = ['The Times 03/Jan/2009 Chancellor on brink of second bailout for banks']
  const tree = merkle('sha256').sync(body)
  const merkleRoot = tree.root() || '0'.repeat(64)
  const difficulty = 0
  const nonce = 0

  const header = new BlockHeader(version, index, previousHash, timestamp, merkleRoot, difficulty, nonce)

  return new Block(header, body)
}

let Blocks = [createGenesisBlock()]

function getBlocks() {
  return Blocks
}

function getLastBlock() {
  return Blocks[Blocks.length - 1]
}

function createHash(data) {
  const { version, previousHash, timestamp, merkleRoot, difficulty, nonce } = data.header
  const blockString = version + previousHash + timestamp + merkleRoot + difficulty + nonce
  const hash = cryptojs.SHA256(blockString).toString()
  return hash
}

function calcurateHash(version, previousHash, timestamp, merkleRoot, difficulty, nonce) {
  const blockString = version + previousHash + timestamp + merkleRoot + difficulty + nonce
  const hash = cryptojs.SHA256(blockString).toString()
  return hash
}

const genesisBlock = createGenesisBlock()
console.log(genesisBlock);

function nextBlock(bodyData) {
  const prevBlock = getLastBlock()
  const version = getVersion()
  const index = prevBlock.header.index + 1
  const previousHash = createHash(prevBlock)
  const timestamp = parseInt(Date.now() / 1000)
  const tree = merkle('sha256').sync(bodyData)
  const merkleRoot = tree.root() || '0'.repeat(64)
  const difficulty = 0
  // const nonce = 0

  const header = findBlock(version, index, previousHash, timestamp, merkleRoot, difficulty)
  return new Block(header, bodyData)
}

function replaceChain(newBlocks) {
  if (isValidChain(newBlocks)) {
    if ((newBlocks.length > Blocks.length) || (newBlocks.length === Blocks.length) && random.boolean()) {
      Blocks = newBlocks;
      broadcast(responseLatestMsg());
    }
  } else {
    console.log("받은 원장 오류");
  }
}

function hexToBinary(s) {
  const lookupTable = {
    '0' : '0000' , '1' : '0001', '2' : '0010', '3' : '0011',
    '4' : '0100' , '5' : '0101', '6' : '0110', '7' : '0111',
    '8' : '1000' , '9' : '1001', 'A' : '1010', 'B' : '1011',
    'C' : '1100' , 'D' : '1101', 'E' : '1110', 'F' : '1111',
  }

  let ret = "";
  for (let i = 0; i < s.length; i++) {
    if (lookupTable[s[i]]) {
      ret += lookupTable[s[i]];
    }
    else {
      return null;
    }
    return ret;
  }
} 

function hashMatchesDifficulty(hash, difficulty) {
  const hashBinary = hexToBinary(hash.toUpperCase())
  const requirePrefix = '0'.repeat(difficulty)
  return hashBinary.startsWith(requirePrefix) // 시작부분이 같으면 true
}

function findBlock(currentVersion, nextIndex, previousHash, nextTimestamp, merkleRoot, difficulty) {
  let nonce = 0;

  while(true) {
    let hash = calcurateHash(currentVersion, nextIndex, previousHash, nextTimestamp, merkleRoot, difficulty, nonce)

    if (hashMatchesDifficulty(hash, difficulty)) {
      return new BlockHeader(currentVersion, nextIndex, previousHash, nextTimestamp, merkleRoot, difficulty, nonce)
    }
    nonce++;
  }
}

module.exports = {
  Blocks,
  getVersion,
  getBlocks,
  getLastBlock,
  createHash,
  nextBlock,
  replaceChain
}