const express = require("express");
const router = express.Router();
const Fallowtroller = require('../controller/follow');
const check = require("../middelware/auth");

router.get("/prueba-fallow" , Fallowtroller.pruebaFallow);
router.post("/fallow", check.auth, Fallowtroller.fallowAction );
router.delete("/unfallow", check.auth, Fallowtroller.unFallowed);
router.get("/list-fallowed", check.auth, Fallowtroller.listarFallowed);
router.get("/list-user-fallowed", check.auth, Fallowtroller.userFallowed);
// exportar router

module.exports= router;