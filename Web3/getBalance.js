const Web3 = require("web3");
const rpcURL = "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"; // 원격 이더리움 노드에 접속할 수 있는 주소

const web3 = new Web3(rpcURL); // web3 객체 생성

// 지갑 잔액 불러오기
const account = "0x500489A3cC124Ce3F21197b2E1859DbD584D8FA5";

web3.eth
  .getBalance(account)
  .then((balance) => {
    console.log(`지갑 ${account}의 잔액은 ${balance}입니다.`);
    return web3.utils.fromWei(balance, "ether"); // web3.utils.fromWei 를 사용해 ether 단위로 변경
  })
  .then((balanceETH) => {
    console.log(`이더 단위로는 ${balanceETH} ETH 입니다.`);
  });

// 트랜잭션 조회하기
const txId =
  "0x36875eff51d4dba7e44d7cfb938368c1c9d0d44416db7111c0a7bd3a118c8e2f";

web3.eth.getTransactionReceipt(txId).then((obj) => {
  console.log(obj);
});

/*
    - `web3.eth.getTransaction()`과 `web3.eth.getTransactionReceipt()` 의 차이점에는 어떤 것이 있나요?
    - 트랜잭션의 정보를 불러오는 `web3.eth.getPendingTransactions()` , `web3.eth.getTransactionFromBlock` 등은 어떤 값을 반환하나요?
*/

// 블록 조회하기

// getBlock.js
const blockNum = "7661864";

web3.eth.getBlock(blockNum).then((obj) => {
  console.log(obj);
});
