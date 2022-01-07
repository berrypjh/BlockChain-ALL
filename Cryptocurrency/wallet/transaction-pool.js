const Transaction = require('./transaction');

class TransactionPool {
  constructor() {
    this.transactionMap = {};
  }

  clear() {
    this.transactionMap = {};
  }

  setTransaction(transaction) {
    this.transactionMap[transaction.id] = transaction;
  }

  setMap(transactionMap) {
    this.transactionMap = transactionMap;
  }

  existingTransaction({ inputAddress }) {
    const transactions = Object.values(this.transactionMap);

    const test = transactions.find((transaction) => {
      if (transaction.input.address === inputAddress) {
        return transaction;
      }
    });
    return test;
  }

  validTransactions() {
    return Object.values(this.transactionMap).filter(
      transaction => Transaction.validTransaction(transaction)
    );
  }

  clearBlockchainTransactions({ chain }) {
    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      
      for (let transaction of block.data) {
        if (this.transactionMap[transaction.id]) {
          delete this.transactionMap[transaction.id];          
        }
      }
    }
  }
}

module.exports = TransactionPool;