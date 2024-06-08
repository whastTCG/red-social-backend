const mongoose = require("mongoose");

const connection = async() =>{
    try {
        await mongoose.connect("mongodb://localhost:27017/mi_redsocial",{family:4});

        console.log("Conectado correctamente a bd: mi_redsocial");


    } catch (error) {
        console.log(error);
        throw new Error(" no se ha podido conectar a la bd")
    }
}

module.exports =  connection
