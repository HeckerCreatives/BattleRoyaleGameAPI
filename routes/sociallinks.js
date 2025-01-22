const { getsociallinks } = require("../controllers/sociallinks")
const { protectplayer } = require("../middleware/middleware")

const router = require("express").Router()

router
 .get("/getsociallinks", protectplayer, getsociallinks)

module.exports = router