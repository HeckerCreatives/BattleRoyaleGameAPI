const router = require("express").Router()
const { authlogin, getreferralusername, register } = require("../controllers/auth")

router
    .get("/login", authlogin)
    .post("/register", register)

module.exports = router;
