// https://github.com/trufflesuite/ganache

let ganache = require("ganache-cli");

let server = ganache.server();
server.listen(8080, function (err, blockchain) {
  console.log(blockchain.accounts);
});
