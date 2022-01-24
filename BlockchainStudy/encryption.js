const fs = require('fs')
const ecdsa = require('elliptic'); // 타원 곡선 디지털 서명 알고리즘
const { TxIn, Transaction, getTransactionId, signTxIn } = require('./tranjection');
const ec = new ecdsa.ec("secp256k1")

const privateKeyLocation = "wallet/" + (process.env.PRIVATE_KEY || "default");
const privateKeyFile = privateKeyLocation + "/private_key"

function initWallet() {
  if (fs.existsSync(privateKeyFile)) {
    console.log("기존 지갑 private key 경로 : " + privateKeyFile);
    return;
  }

  if (!fs.existsSync("wallet/")) {
    fs.mkdirSync("wallet/")
  }

  if (!fs.existsSync(privateKeyLocation)) {
    fs.mkdirSync(privateKeyLocation)
  }

  const newPrivateKey = generatePrivateKey();
  fs.writeFileSync(privateKeyFile, newPrivateKey);
  console.log("새로운 지갑 생성 private key 경로 : " + privateKeyFile);
}

initWallet();

function generatePrivateKey() {
  const keyPair = ec.genKeyPair();
  const privateKey = keyPair.getPrivate();
  return privateKey.toString(16);
}

function getPrivateKeyFromWallet() {
  const buffer = fs.readFileSync(privateKeyFile, "utf-8");
  return buffer.toString();
}

function getPublicKeyFromWallet() {
  const privateKey = getPrivateKeyFromWallet();
  const key = ec.keyFromPrivate(privateKey, "hex");
  return key.getPublic().encode("hex");
}

// 잔고 계산용 (쓰이지 않는 트랜잭션 아웃풋을 전부 더함)
const getBalance = (address, uTxOuts) => {
  return _(uTxOuts)
    .filter(uTxO => uTxO.address === address)
    .map(uTxO => uTxO.amount)
    .sum();
};

// 소진되지 않은 트랜잭션 아웃 목록을 순회하며 우리가 원하는 금액이 될때까지 반복문을 돌린다.
const findAmountInUTxOuts = (amountNeeded, myUTxOuts) => {
  let currentAmount = 0;
  const includedUTxOuts = [];
  for (const myUTxOut of myUTxOuts) {
    includedUTxOuts.push(myUTxOut);
    currentAmount = currentAmount + myUTxOut.amount;
    if (currentAmount >= amountNeeded) {
      const leftOverAmount = currentAmount - amountNeeded;
      return { includedUTxOuts, leftOverAmount };
    }
  }
  throw Error("Not enough founds");
};

const createTxOuts = (receiverAddress, myAddress, amount, leftOverAmount) => {
  const receiverTxOut = new TxOut(receiverAddress, amount);
  if (leftOverAmount === 0) {
    return [receiverTxOut];
  } else {
    const leftOverTxOut = new TxOut(myAddress, leftOverAmount);
    return [receiverTxOut, leftOverTxOut];
  }
};

// Tx 생성
const createTx = (receiverAddress, amount, privateKey, uTxOutList, memPool) => {
  const myAddress = getPublicKeyFromWallet(privateKey);
  // const myUTxOuts = uTxOutList.filter(uTxO => uTxO.address === myAddress);

  // const filteredUTxOuts = filterUTxOutsFromMempool(myUTxOuts, memPool);

  const { includedUTxOuts, leftOverAmount } = findAmountInUTxOuts(
    amount,
    filteredUTxOuts
  );

  // TxIn 에 넣는다. (Inputs 엔 이전 Output 을 참조한다.)
  const toUnsignedTxIn = uTxOut => {
    const txIn = new TxIn();
    txIn.txOutId = uTxOut.txOutId;
    txIn.txOutIndex = uTxOut.txOutIndex;
    return txIn;
  };

  const unsignedTxIns = includedUTxOuts.map(toUnsignedTxIn);

  const tx = new Transaction();

  tx.txIns = unsignedTxIns;
  tx.txOuts = createTxOuts(receiverAddress, myAddress, amount, leftOverAmount);

  tx.id = getTransactionId(tx);

  tx.txIns = tx.txIns.map((txIn, index) => {
    txIn.signature = signTxIn(tx, index, privateKey, uTxOutList);
    return txIn;
  });

  return tx;
};

module.exports = {
  getPublicKeyFromWallet
}