const router = require("express").Router()
const { getusergamedetails, updateusergamedetails, checkingamemaintenance, useenergy } = require("../controllers/usergamedetails")
const { protectplayer } = require("../middleware/middleware")

router
    .get("/getusergamedetails", protectplayer, getusergamedetails)
    .get("/checkingamemaintenance", protectplayer, checkingamemaintenance)
    .post("/updateusergamedetails", protectplayer, updateusergamedetails)
    .post("/useenergy", protectplayer, useenergy)
    
module.exports = router;
