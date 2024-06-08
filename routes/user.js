
const express = require("express");
const router = express.Router();
const Usercontroller = require('../controller/user');
const check = require("../middelware/auth");
const multer = require("multer");

//configuracion de subida de imagenes por multer(un midelware)

const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, "./upload/avatars");
    },
    filename: (req, file, cb) =>{
        cb(null, "avatar-"+Date.now() +"-"+ file.originalname);
    }
});

const upload = multer({storage});


router.post("/register", Usercontroller.register);
router.post("/login", Usercontroller.login);
router.post("/upload-image", [check.auth, upload.single("file0")],  Usercontroller.uploadImage);
router.get("/prueba-usuario", check.auth, Usercontroller.pruebaUsuario);
router.get("/profile/:id", check.auth, Usercontroller.profile);
router.get("/list", check.auth, Usercontroller.list);
router.get("/avatar/:file",  Usercontroller.avatar);
router.get("/count/:id", check.auth, Usercontroller.counters);
router.put("/update-por-id/:id", Usercontroller.updatePorId);
router.put("/update", check.auth, Usercontroller.update);

// exportar router

module.exports= router;