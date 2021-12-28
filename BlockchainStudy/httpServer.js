const express = require("express")
const bodyParser = require("body-parser")
const { nextBlock, getBlocks, getVersion } = require("./chainedBlock")
const { addBlock } = require("./checkValidBock")

const http_port = process.env.HTTP_PORT || 3001

function initHttpServer() {
  const app = express()
  app.use(bodyParser.json())

  app.get("/blocks", (req, res) => {
    res.send(getBlocks())
  })

  app.post("/mineBlock", (req, res) => {
    const data = req.body.data || []
    const block = nextBlock(data)
    addBlock(block)

    res.send(block)
  })

  app.get("/version", (req, res) => {
    res.send(getVersion())
  })

  app.post("/stop", (req, res) => {
    res.send({ "msg" : "Stop Server!" })
    process.exit()
  })

  app.listen(http_port, () => {
    console.log("Listening Http Port : " + http_port);
  })
}

initHttpServer();