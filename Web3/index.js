const express = require("express");
const app = express();
const port = 8080;
const Web3 = require("web3");

const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

/** 계정 얻는 함수 */
async function getAccounts() {
  try {
    const accounts = await web3.eth.getAccounts();
    console.log(accounts);
    return accounts;
  } catch (e) {
    console.log(e);
    return e;
  }
}

app.get("/", (req, res) => {
  getAccounts().then((accounts) => {
    res.send(accounts);
  });
});

/** 가스비 확인 함수 */
async function getGasPrice() {
  try {
    const gasPrice = await web3.eth.getGasPrice();
    console.log(gasPrice);
    return gasPrice;
  } catch (e) {
    console.log(e);
    return e;
  }
}

app.get("/gasprice", (req, res) => {
  getGasPrice().then((gasPrice) => {
    res.send(gasPrice);
  });
});

/** 블록 정보 얻는 함수 */
async function getBlock() {
  try {
    const getBlock = await web3.eth.getBlock("latest");
    console.log(getBlock);
    return getBlock;
  } catch (e) {
    console.log(e);
    return e;
  }
}

app.get("/getblock", (req, res) => {
  getBlock().then((getBlock) => {
    res.send(getBlock);
  });
});

app.listen(port, () => {
  console.log("Listening...");
});
