const express = require("express");
const router = express.Router();
const publicationController = require('../controller/publication');
const check = require("../middelware/auth");
const multer = require("multer");

const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, "./upload/publications");
    },
    filename: (req, file, cb) =>{
        cb(null, "pub-"+Date.now() +"-"+ file.originalname);
    }
});

const upload = multer({storage});

router.get("/prueba-publication" , publicationController.pruebaPublication);
router.get("/list-publication", check.auth, publicationController.listOne);
router.get("/list-publications", check.auth, publicationController.userList);
router.put("/save-publication", check.auth, publicationController.savePublication );
router.delete("/remove-publication", check.auth, publicationController.remove);
router.post("/upload-image", [check.auth, upload.single("file0")],  publicationController.uploadImage);
router.get("/media/:file",  publicationController.media);
router.get("/feed/", check.auth, publicationController.feed);

// exportar router

module.exports= router;