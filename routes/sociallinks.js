const { getsociallinks, getspecificsociallink } = require("../controllers/sociallinks")
const { protectplayer } = require("../middleware/middleware")

const router = require("express").Router()

router
 .get("/getspecificsociallink", getspecificsociallink)

module.exports = router