const Block = require("./block");
const { cryptoHash } = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require("../config");
const Transaction = require("../wallet/transaction");
const Wallet = require("../wallet");

class Blockchain {
  // 기본 블록을 넣고
  constructor() {
    this.chain = [Block.genesis()];
  }

  // 체인에 추가한다.
  addBlock({ data }) {
    // Block 클래스에서 체굴
    const newBlock = Block.minedBlock({
      lastBlock: this.chain[this.chain.length-1],
      data
    });

    // 후 추가
    this.chain.push(newBlock);
  }

  replaceChain(chain, validTransactions , onSuccess) {
    if (chain.length <= this.chain.length) {
      console.error('The incoming chain must be longer');
      return;
    }

    if (!Blockchain.isValidChain(chain)) {
      console.error('The incoming chain must be valid');
      return;
    }
    
    if (validTransactions && !this.validTransactionData({ chain })) {
      console.error('The incoming chain has invalid data');
      return;
    }

    if(onSuccess) onSuccess();
    console.log('replacing chain with', chain);
    this.chain = chain;
  }

  validTransactionData({ chain }) {
    for (let i = 0; i < chain.length; i++) {
      const block = chain[i];
      const transactionSet = new Set();
      let rewardTransacionCount = 0;

      for (let transaction of block.data) {
        if (transaction.input.address === REWARD_INPUT.address) {
          rewardTransacionCount += 1;

          if (rewardTransacionCount > 1) {
            console.error('Miner rewards exceed limit');
            return false;
          }

          if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
            console.error('Miner reward amout is invalid');
            return false;
          }
        } else {
          if (!Transaction.validTransaction(transaction)) {
            console.error('Invalid transaction');
            return false;
          }

          const trueBalance = Wallet.calculateBalance({
            chain: this.chain,
            address: transaction.input.address
          });

          if (transaction.input.amount !== trueBalance) {
            console.error('Invalid input amount');
            return false;
          }

          if (transactionSet.has(transaction)) {
            console.error('An identical transaction appears more than in the block');
            return false;
          } else {
            transactionSet.add(transaction);
          }
        }
      }
    }
    return true;
  }

  // 체인 검증
  static isValidChain(chain) {
    // 0번째 블록은 기본 블록이어야한다.
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis()))  {
      return false;
    };


    for (let i = 1; i < chain.length; i++) {
      const { timestamp, lastHash, hash, nonce, difficulty, data } = chain[i];
      const actualLastHash = chain[i-1].hash;
      const lastDifficulty = chain[i-1].difficulty;

      if (lastHash !== actualLastHash) return false;

      const validatedHash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);

      if (hash !== validatedHash) return false;

      if (Math.abs(lastDifficulty - difficulty) > 1) return false;
    }
    return true;
  }
}

module.exports = Blockchain;