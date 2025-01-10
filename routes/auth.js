const router = require("express").Router()
const { authlogin, checkuserlogin, register } = require("../controllers/auth")

router
    .get("/login", authlogin)
    .post("/register", register)
    .get("/checkuserlogin", checkuserlogin)

module.exports = router;
