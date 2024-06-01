const router = require("express").Router()
const { getinboxlist, openmessage } = require("../controllers/inbox")
const { protectplayer } = require("../middleware/middleware")

router
    .get("/getinboxlist", protectplayer, getinboxlist)
    .post("/openmessage", protectplayer, openmessage)
    
module.exports = router;
