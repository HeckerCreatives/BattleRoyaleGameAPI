const router = require("express").Router()
const { getusergamedetails } = require("../controllers/usergamedetails")
const { protectplayer } = require("../middleware/middleware")

router
    .get("/getusergamedetails", protectplayer, getusergamedetails)
    
module.exports = router;
