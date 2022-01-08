const hexToBinary = require('hex-to-binary');
const { GENESIS_DATA, MINE_RATE } = require("../config");
const { cryptoHash } = require("../util");

class Block {
  constructor({ timestamp, lastHash, hash, data, nonce, difficulty }) {
    this.timestamp = timestamp;
    this.lastHash = lastHash;
    this.hash = hash;
    this.data = data;
    this.nonce = nonce;
    this.difficulty = difficulty;
  }

  static genesis() {
    return new this(GENESIS_DATA);
  }

  static minedBlock({ lastBlock, data }) {
    let hash, timestamp;
    const lastHash = lastBlock.hash;
    let { difficulty } = lastBlock;
    let nonce = 0;
    
    // 아래는 난이도 조절, 선행 -비트를 통해 검증한다.
    do {
      nonce++;
      timestamp = Date.now();
      // 난이도를 정한다.
      difficulty = Block.adjustDifficulty({ originalBlock: lastBlock, timestamp });
      // crypto-hash.js 파일에서 해쉬화를 한다.
      hash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);  
    } while (hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty));

    return new this({ timestamp, lastHash, data, difficulty, nonce, hash });
  }

  static adjustDifficulty({ originalBlock, timestamp }) {
    const { difficulty } = originalBlock;

    if (difficulty < 1) return 1;

    if ((timestamp - originalBlock.timestamp) > MINE_RATE) return difficulty - 1;

    return difficulty + 1;
  }
}

module.exports = Block;