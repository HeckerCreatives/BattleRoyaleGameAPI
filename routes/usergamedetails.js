const router = require("express").Router()
const { getusergamedetails, updateusergamedetails, checkingamemaintenance } = require("../controllers/usergamedetails")
const { protectplayer } = require("../middleware/middleware")

router
    .get("/getusergamedetails", protectplayer, getusergamedetails)
    .get("/checkingamemaintenance", protectplayer, checkingamemaintenance)
    .post("/updateusergamedetails", protectplayer, updateusergamedetails)
    
module.exports = router;
