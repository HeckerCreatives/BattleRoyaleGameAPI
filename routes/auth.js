const router = require("express").Router()
const { authlogin, checkuserlogin, register, guestaccregister, guestaccbind, walletLogin } = require("../controllers/auth")
const { protectplayer } = require("../middleware/middleware")

router
    .get("/login", authlogin)
    .get("/wallet/login", walletLogin)
    .post("/register", register)
    .post("/guestregister", guestaccregister)
    .post("/guestaccbind", protectplayer, guestaccbind)
    .get("/checkuserlogin", checkuserlogin)

module.exports = router;
