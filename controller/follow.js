//importar modelo
const Fallow = require("../models/Follow");
const User = require("../models/User");

//importar metodo helper que ayuda a saber si las personas que sigo me siguen tambien
const fallowService = require("../services-token/fallowUserId");

// Acciones de prueba
const pruebaFallow = (req, resp) => {
    return resp.status(200).send({
        message: "mensaje enviado desde :controllers/fallow.js"
    });
}

//metodo para guardar un fallow ( accion de seguir)
const fallowAction = async (req, res) => {

    //conseguir los datos por body
    params = req.body;
    //sacar el id del usuario identificado
    let myIdUser = req.user.id;
    //crear un objeto con modelo follow
    let userToFallow = new Fallow({
        user: myIdUser,
        fallowed: params.fallowed
    });

    let consulta = await Fallow.find({user: myIdUser,  fallowed: params.fallowed })
    if (consulta && consulta.length >= 1) {
        return res.status(200).send({
            status: "success",
            message: "ya sigues a este usuario",

        })
    }
    //se puede hacer de la forma de arriba o la comentada abajo para pasarle los datos como parametro
    // userToFallow.user = myIdUser;
    // userToFallow.fallowed = params.fallowed;
    //guardar objeto en base de datos
    try {
        await userToFallow.save();
        return res.status(200).send({
            status: "success",
            message: "usuario seguido correctamente",
            userToFallow
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "no se puede seguir al usuario",
            error: error
        });
    }

    // return res.status(200).send({
    //     status:"success",
    //     message:"metodo seguir",
    //     userToFallow
    // })
}

//Accion de borrar un fallow (dejar de seguir)
const unFallowed = async (req, res) => {

    let idFallowed = req.query.unfallow;
    let userId = req.user.id;
    if (!idFallowed) {
        return res.status(400).send({
            status: "error",
            message: "id no encontrado",

        });
    }


    try {
        consulta = await Fallow.findOneAndDelete({
            fallowed: idFallowed,
            user: userId
        });
        if (!consulta) {
            return res.status(500).send({
                status: "error",
                message: "usuario no encontrado",

            });

        }

        return res.status(200).send({
            status: "success",
            message: "usuario unfallow correctamente",
            consulta
        });


    } catch (error) {
        console.log("error al ejecutar la funcion unfallow:"+ error)
        return res.status(500).send({
            status: "error",
            message: "se produjo un error en la peticion",
            error
        });
    }




}
//Accion de listar los usuarios que estoy siguiendo

const listarFallowed = async (req, res) => {

    //recoger el id del usuario logeado
    let idUser = req.user.id;

    //comprobar si me llega el id por parametro url 
    if (req.query.id) {
        idUser = req.query.id;
    }

    //tomar pagina que llega por parametro url en caso que no llegue colocar por defecto la 1
    let page = parseInt(req.query.page) || 1;
    //declarar item por pagina 
    let itemsPerPage = 2;

    //declarar objeto option para pasarle al metodo pagination
    let options = {
        page: page,
        limit: itemsPerPage,
        sort: { _id: -1 },
        collation: {
            locale: "es"
        },
        populate: {
            path: "user fallowed",
            select:{password:0, roll:0, __v:0}
        }
    };

    try {

        const total = await Fallow.countDocuments({ user: idUser });

        //recoger una lista de los usuarios que sigue
        const consulta = await Fallow.paginate({ user: idUser }, options);

        let fallowUserId = await fallowService.fallowUserIds(idUser);

        return res.status(200).send({
            status: "success",
            message: "lista de usuarios que sigo",
            fallowed: consulta.docs,
            page,
            itemsPerPage,
            total,
            pages: Math.ceil(total / itemsPerPage),
            userFallowing:fallowUserId.fallowing,
            userFalloMe:fallowUserId.fallowerds
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "se produjo un error en la peticion",
            error
        });
    }


    // return res.status(200).send({
    //     status: "success",
    //     message: "metodo de listar usuarios que sigo",
    //     consulta
    //     //user:req.user
    // });
}

//accion de listar los usuarios que me siguen
const userFallowed = async (req, res) => {
    //recuperar el id del usuario logeado
    let idUser = req.user.id;

    //conseguir la pagina por parametro para la paginacion sino llega nada dejarla por defecto en 1
    page = parseInt(req.query.page) || 1;

    //comprobar si me llega el id por parametro url 
    if (req.query.id) {
        idUser = req.query.id;
    }
    //variable para colocar item por paginacion 
    itemsPerPage = 2;
    let fallowUserId = await fallowService.fallowUserIds(idUser);
    //declarar objeto option para pasarle al metodo pagination
    //la opcion populate me permite traer el objeto completo al cual esta relaiconado el id en este caso el me trae el usuario que sigue como el seguido que seria el fallowed
    //el path toma el id del usuario y del usuario que es seguido y trae el objeto de cada uno de esos usuarios completo y el select excluimos los campos que queramos dandole 
    //0 como opcioon de esta forma excluimos el password cuando nos traigan la lista de usuarios
    let options = {
        page: page,
        limit: itemsPerPage,
        sort: { _id: -1 },
        collation: {
            locale: "es"
        },
        populate: {
            path: "user fallowed",
            select:{password:0, roll:0, __v:0}
        },
        userFallowing:fallowUserId.fallowing,
        userFalloMe:fallowUserId.fallowerds
    };

    try {
        //sacar total usuarios encontrados
        const total = await Fallow.countDocuments({ fallowed: idUser });
        //consulta para buscar y listar los usuarios que me siguen
        const consulta = await Fallow.paginate({ fallowed: idUser }, options);

        return res.status(200).send({
            status: "success",
            message: "lista de usuarios que me siguen",
            fallowed: consulta.docs,
            page,
            itemsPerPage,
            total,
            pages: Math.ceil(total / itemsPerPage),
            userSesion: req.user,
            userFallowing:fallowUserId.fallowing,
            userFalloMe:fallowUserId.fallowerds
        })
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "hubo un error con la peticion",
            error
        })
    }
}

//exportar accionmes
module.exports = {
    pruebaFallow,
    fallowAction,
    unFallowed,
    listarFallowed,
    userFallowed
}