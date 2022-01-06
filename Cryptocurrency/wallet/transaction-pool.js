class TransactionPool {
  constructor() {
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
}

module.exports = TransactionPool;