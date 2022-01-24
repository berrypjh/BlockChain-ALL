const ecdsa = require("elliptic");
const ec = new ecdsa.ec("secp256k1");
const CryptoJS = require("crypto-js"); 

class TxOut {
  constructor(address, amount) {
    this.address = address; 
    this.amount = amount; 
  }
}

class TxIn {
  constructor(txOutId, txOutIndex, signature) {
    this.txOutId = txOutId;
    this.txOutIndex = txOutIndex;
    this.signature = signature;
  }
}

class Transaction {
  constructor(id, txIns, txOuts) {
    this.id = id;
    this.txIns = txIns;
    this.txOuts = txOuts;
  }
}

// + 유효한 트랜잭션 ID
const getTransactionId = (transaction) => {
  const txInContent = transaction.txIns
    .map((txIn) => txIn.txOutId + txIn.txOutIndex)
    .reduce((a, b) => a + b, '')

  const txOutContent = transaction.txOuts
    .map((txOut) => txOut.address + txOut.amount)
    .reduce((a, b) => a + b, '')

    // return { txInContent, txOutContent };
    return CryptoJS.SHA256(txInContent + txOutContent).toString();
}

// 트랜잭션을 임의로 만드는 함수
function generateTransaction() {
  const trans = new Transaction();
  trans.id = 1;
  trans.txIns = [];
  trans.txOuts = [];

  for (let i = 0; i < 5; i++) {
    const txIn = new TxIn("Id : " , i, "");
    trans.txIns.push(txIn);
  }

  for (let i = 0; i < 5; i++) {
    const txOut = new TxOut("address : ", 30);
    trans.txOuts.push(txOut);
  }

  return trans;
}
// 임의 테스트
// const newTransaction = generateTransaction();

// const { txInContent, txOutContent } = getTransactionId(newTransaction);
// console.log(txInContent);
// console.log(txOutContent);

const findUnspentTxOut = (txOutId, txOutIndex, uTxOutList) => {
  return uTxOutList.find(
    uTxO => uTxO.txOutId === txOutId && uTxO.txOutIndex === txOutIndex
  );
};

const signTxIn = (transaction, txInIndex, privateKey, aUnspentTxOuts) => {
  const txIn = transaction.txIns[txInIndex];
  const dataToSign = transaction.id;
  const referencedUnspentTxOut = findUnspentTxOut(
    txIn.txOutId,
    txIn.txOutIndex,
    aUnspentTxOuts
  );
  const referencedAddress = referencedUnspentTxOut.address;
  const key = ec.keyFromPrivate(privateKey, "hex");
  const signature = toHexString(key.sign(dataToSign).toDER());
  return signature;
};

class UnspentTxOut {
  constructor(txOutId, txOutIndex, address, amount) {
    this.txOutId = txOutId;
    this.txOutIndex = txOutIndex;
    this.address = address;
    this.amount = amount;
  }
}
let unspentTxOuts = [];

const updateUnspentTxOuts = (newTransactions, unspentTxOutLists) => {
  const newUnspentTxOuts = newTransactions
    .map(tx =>
      tx.txOuts.map(
        (txOut, index) => new UnspentTxOut(tx.id, index, txOut.address, txOut.amount)
      )
    )
    .reduce((a, b) => a.concat(b), []);

  const spentTxOuts = newTransactions
    .map(tx => tx.txIns)
    .reduce((a, b) => a.concat(b), [])
    .map(txIn => new UnspentTxOut(txIn.txOutId, txIn.txOutIndex, "", 0));

  const resultingUnspentTxOuts = unspentTxOutLists
    .filter(uTxO => !findUnspentTxOut(uTxO.txOutId, uTxO.txOutIndex, spentTxOuts))
    .concat(newUnspentTxOuts);

  return resultingUnspentTxOuts;
}

const validateTx = (tx, uTxOutList) => {
  // 트랜잭션 타입 확인
  if (!isTxStructureValid(tx)) {
    console.log("Tx structure is invalid");
    return false;
  }

  // 유효한 트랜잭션 ID
  if (getTransactionId(tx) !== tx.id) {
    console.log("Tx ID is not valid");
    return false;
  }

  // Valid txIns
  const hasValidTxIns = tx.txIns.map(txIn =>
    validateTxIn(txIn, tx, uTxOutList)
  );

  if (!hasValidTxIns) {
    console.log(`The tx: ${tx} doesn't have valid txIns`);
    return false;
  }

  // Valid txOut values
  const amountInTxIns = tx.txIns
    .map(txIn => getAmountInTxIn(txIn, uTxOutList))
    .reduce((a, b) => a + b, 0);

  const amountInTxOuts = tx.txOuts
    .map(txOut => txOut.amount)
    .reduce((a, b) => a + b, 0);

  if (amountInTxIns !== amountInTxOuts) {
    console.log(`The tx: ${tx} doesn't have the same amount in the txOut as in the txIns`);
    return false;
  } else {
    return true;
  }
};

// + 트랜잭션 타입 확인
const isTxStructureValid = tx => {
  if (typeof tx.id !== "string") {
    console.log("Tx ID is not valid");
    return false;
  } else if (!(tx.txIns instanceof Array)) {
    console.log("The txIns are not an array");
    return false;
  } else if (!tx.txIns.map(isTxInStructureValid).reduce((a, b) => a && b, true)) {
    console.log("The structure of one of the txIn is not valid");
    return false;
  } else if (!(tx.txOuts instanceof Array)) {
    console.log("The txOuts are not an array");
    return false;
  } else if (!tx.txOuts.map(isTxOutStructureValid).reduce((a, b) => a && b, true)) {
    console.log("The structure of one of the txOut is not valid");
    return false;
  } else {
    return true;
  }
};

// + Valid txIns
const validateTxIn = (txIn, tx, uTxOutList) => {
  const wantedTxOut = uTxOutList.find(uTxO => uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex);
  if (wantedTxOut === undefined) {
    console.log(`Didn't find the wanted uTxOut, the tx: ${tx} is invalid`);
    return false;
  } else {
    const address = wantedTxOut.address;
    const key = ec.keyFromPublic(address, "hex");
    return key.verify(tx.id, txIn.signature);
  }
};

// + Valid txOut values
const getAmountInTxIn = (txIn, uTxOutList) =>
  findUTxOut(txIn.txOutId, txIn.txOutIndex, uTxOutList).amount;

// 코인베이스 아웃풋의 양
const COINBASE_AMOUNT = 50;

// Coinbase transaction 유효성 검사
const validateCoinbaseTx = (tx, blockIndex) => {
  if (getTransactionId(tx) !== tx.id) {
    console.log("Invalid Coinbase tx ID");
    return false;
  } else if (tx.txIns.length !== 1) {
    console.log("Coinbase TX should only have one input");
    return false;
  } else if (tx.txIns[0].txOutIndex !== blockIndex) {
    console.log("The txOutIndex of the Coinbase Tx should be the same as the Block Index");
    return false;
  } else if (tx.txOuts.length !== 1) {
    console.log("Coinbase TX should only have one output");
    return false;
  } else if (tx.txOuts[0].amount !== COINBASE_AMOUNT) {
    console.log(`Coinbase TX should have an amount of only ${COINBASE_AMOUNT} and it has ${tx.txOuts[0].amount}`);
    return false;
  } else {
    return true;
  }
};

// Coinbase transaction
const createCoinbaseTx = (address, blockIndex) => {
  const tx = new Transaction();
  const txIn = new TxIn();
  txIn.signature = "";
  txIn.txOutId = "";
  txIn.txOutIndex = blockIndex;
  tx.txIns = [txIn];
  tx.txOuts = [new TxOut(address, COINBASE_AMOUNT)];
  tx.id = getTransactionId(tx);
  return tx;
};
