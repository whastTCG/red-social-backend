//importar dependencias
const connection = require("./database/connection");
const express = require("express");
const cors= require("cors");


// Mensaje de bienvenida
console.log("Api node para red social arrancada")

//conection base de datos
connection();

//crear servidor node
const app = express();
const puerto = 3900;

// configurar cors
app.use(cors());

// convertir los datos del body en objeto js
app.use(express.json());
app.use(express.urlencoded({extended:true}));
// cargar conf rutas
const userRouter = require("./routes/user.js");
const publicationRouter = require("./routes/publication");
const fallowRouter = require("./routes/fallow");

app.use("/api/user", userRouter);
app.use("/api/publication", publicationRouter);
app.use("/api/fallow", fallowRouter);
//ruta de prueba
app.get("/ruta-prueba", (req, resp) =>{
    return resp.status(200).json(
        {
            id:1,
            "nombre" : "bryan",
            "statuss": "success"
        }
    );
})

// poner servidor a escuchar peticiones http
app.listen(puerto, () => {
    console.log("servidor de node corriendo en el puerto:" + puerto);
})