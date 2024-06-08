//importar dependencias o modulos
const jwt = require("jwt-simple");
const moment = require("moment");

//importar clave secreta
const libjwt = require("../services-token/jwt");
const secret = libjwt.secret;

//funcion midelware de autenticacion
exports.auth = (req, res, next) => {
    //comprobar si me llega la cabecera de autenticacion
    if (!req.headers.authorization) {
        return res.status(403).send({
            status: "error",
            message: "la peticion no tiene la cabecera de autenticacion"
        })
    }

    //limpiar el token el replace lo usamos para limpiar el string del token 
    //en este caso si trae comillas simples o doble se las quiotamos, la g es que indica global que se las quita a todo el string

    let token = req.headers.authorization.replace(/['"]+/g, '');




    try {
        const payload = jwt.decode(token, secret)
        console.log(payload.exp);
        // comprobar la expiracion del token
        if (payload.exp <= moment().unix()) {
            return res.status(401).send({
                status: "error",
                message: "token expirado"

            })
        }

        //agregar datos de usuarios a request
        req.user = payload;


    } catch (error) {
        return res.status(404).send({
            status: "error",
            message: "token invalido",
            error
        })
    }


    //pasar a la ejecucion de la ruta
    next();
}

