const router = require("express").Router()
const { authlogin, getreferralusername } = require("../controllers/auth")

router
    .get("/login", authlogin)

module.exports = router;
