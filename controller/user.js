// Acciones de prueba
//importar dependencias y modulos
const User = require("../models/User");
const Fallow = require("../models/Follow");
const Publicacion = require("../models/Publication");
const bcrypt = require("bcrypt")
//importar servicios jwt
const jwt = require("../services-token/jwt");
//libreria fs permite borrar un archivo de una ruta, en este caso lo usamos para borrar en el metodo imagen
//en caso de que la imagen no tenga el formato correcto
const fs = require("fs");
//path nmos permite mostrar imagenes en los endpoint ya que convierte el string en una ruta en este caso el string de la imagen
const path = require("path")
const fallowService = require("../services-token/fallowUserId");

const pruebaUsuario = (req, resp) => {
    return resp.status(200).send({
        message: "mensaje enviado desde :controllers/user.js",
        usuario: req.user
    });
}


//registro de usuarios

const register = async (req, res) => {

    //recoger datos de la peticion
    let params = req.body;


    //comprobar que me llegan bien
    if (!params.name || !params.email || !params.password || !params.nick) {
        console.log("validacion incorrecta");
        return res.status(500).json({
            message: "faltan datos por enviar",
            status: "error"
        });
    }

    //crear objeto de usuario

    let user_to_save = new User(params);

    try {
        //controll de usuarios duplicados
        consulta = await User.find({
            $or: [
                { email: user_to_save.email.toLowerCase() },
                { nick: user_to_save.nick.toLowerCase() }
            ]
        }).exec()

        if (consulta && consulta.length >= 1) {
            return res.status(200).send({
                status: "ya existe",
                message: "usuario ya existe"
            })
        }

        //cifrar la pass
        bcrypt.hash(user_to_save.password, 10, async (error, pass) => {
            user_to_save.password = pass;
            //console.log(user_to_save.password);
            try {
                await user_to_save.save()
                return res.status(200).json({
                    status: "sucess",
                    user_to_save,
                    message: "usuario registrado correctamente"
                });
            } catch (error) {
                return res.status(500).json({
                    status: "error al guardar el usuario",
                    message: error
                })
            }


 
        })
        // return res.status(200).json({
        //     message: "Accion de registro de usuarios",
        //     status: "success",
        //     user_to_save
        // });


        // guardar el usuario en la base de dastos

        //devolver el resultado
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: error
        })
    }


}

//autentificacion de usuario
const login = async (req, res) => {

    //recoger parametros

    params = req.body;

    if (!params.email || !params.password) {
        return res.status(400).send({
            status: "error",
            message: "faltan datos por enviar"
        })
    }

    //buscar en la bd si existe
    try {
        const userLogin = await User.
            findOne({ email: params.email })
            //con el select restringimos los datos que queremos enviar y obtener del usuario buscado en este caso la fecha de creacion del usuario
            .select({ "created_at": 0 })

        if (!userLogin) {

            return res.status(404).send({
                status: "no existe",
                message: "no existe el usuario"
            });
        }

        //comprobar su password con compareSync se compara el password que llega por parametro ( el que ingresa el usuario) vs
        //el que encontramos con la consulta de arriba que es el que esta en la bd en caso de que los mail coincidan
        const pwd = bcrypt.compareSync(params.password, userLogin.password)

        if (!pwd) {
            return res.status(400).send({
                status: "error password",
                message: "password incorrecto"
            });
        }

        //conseguir el token
        const token = jwt.createToken(userLogin);


        //si es correcta devolvemos el token 

        //devolver datos del usuario
        return res.status(200).send({
            status: "success",
            message: "te has identificado correctamente",
            userLogin: {
                id: userLogin._id,
                name: userLogin.name,
                nick: userLogin.nick,
                roll: userLogin.roll,
                email: userLogin.email
            },
            token
        });

    } catch (error) {
        return res.status(400).json({
            status: "error",
            message: error
        })
    }
}

//para devolver la informacion que tiene el usuario osea los datos de su cuenta y pasarlo entre url
const profile = async (req, res) => {
    //recibir el parametro del id de usuario por la url
    const id = req.params.id;

    //consulta para sacar los datos del usuario
    try {

        const consulta = await User.findById(id).select({ password: 0, roll: 0 }).exec();
        if (!consulta) {
            return res.status(404).send({
                status: "error",
                message: "el usuario no existe o hay un error"
            });
        }

        //info de seguimiento
        //infor de fallow 
        let fallowInfo = await fallowService.fallowThisUser(req.user.id, id);
        //console.log(fallowInfo);
        //devolver el resultado
        return res.status(200).send({
            status: "success",
            userProfile: consulta,
            fallowing: fallowInfo.loSigo,
            fallower: fallowInfo.meSigue,
            userIdentiti: req.user

        });
    } catch (error) {
        return res.status(404).send({
            status: "error",
            error
        });
    }
}

//listar los usuarios con paginacion
const list = async (req, res) => {

    //controlar la pagina que estamos
    let page = parseInt(req.query.page) || 1;
    let query = {};

    let itemsPerPage = 4;

    let options = {
        page: page,
        limit: itemsPerPage,
        sort: { _id: -1 },
        collation: {
            locale: "es",
        },
    };

    //hacer consulta con mongoose pagination
    try {
        const consulta = await User.paginate(query, options);

        const total = await User.countDocuments(query);
        if (!consulta)
            return res.status(404).json({
                status: "error",
                message: "No se han encontrado usuarios",
            });

        let fallowUserId = await fallowService.fallowUserIds(req.user.id);
        //devolver resultado (post4eriormente info de follow)

        return res.status(200).json({
            status: "success",
            users: consulta.docs,
            page,
            itemsPerPage,
            total,
            // totalBusqueda,

            // redondeamos con ceil el numero de paginas con usuarios a mostrar
            pages: Math.ceil(total / itemsPerPage),
            userFallowing: fallowUserId.fallowing,
            userFalloMe: fallowUserId.fallowerds
        });
    } catch (error) {
        return res.status(404).json({
            status: "error",
            message: "Hubo un error al obtener los usuarios",
            error: error.message
        });
    }


    // return res.status(200).send({
    //     status: "success",
    //     message: "metodo listar usuarios"
    // });
}

const update = async (req, res) => {
    //let id = req.params.id
    let userToUpdate = req.body;
    let userIdentity = req.user;

    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.roll;
    delete userToUpdate.imagen;

    //comprobar si el usuario ya existe
    //controll de usuarios duplicados
    let consulta = await User.find({
        $or: [
            { email: userToUpdate.email.toLowerCase() },
            { nick: userToUpdate.nick.toLowerCase() }
        ]
    }).exec()

    let userIsset = false;

    consulta.forEach(element => {
        if (element && element._id != userIdentity.id) {
            userIsset = true;
        }
    });

    if (userIsset == true) {
        return res.status(200).send({
            status: "success",
            message: "usuario ya existe"
        })
    }




    try {
        //cifrar la pass
        if (userToUpdate.password) {
            let pwd = await bcrypt.hash(userToUpdate.password, 10);
            userToUpdate.password = pwd;

        }

        consulta = await User.findOneAndUpdate({ _id: userIdentity.id }, userToUpdate, { new: true }).exec();
        return res.status(200).send({
            status: "success",
            userUpdate: consulta,
            message: "usuario actualizado",
            userToUpdate
        });

    } catch (error) {
        return res.status(404).json({
            status: "error",
            message: error
        });
    }

}




const updatePorId = async (req, res) => {
    let id = req.params.id
    let params = req.body;
    let userToUpdate = req.user;

    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.roll;
    delete userToUpdate.imagen;

    //comprobar si el usuario ya existe

    //comprobar que me llegan bien
    if (!params.name || !params.email || !params.password || !params.nick) {
        console.log("validacion incorrecta");
        return res.status(500).json({
            message: "faltan datos por enviar",
            status: "error"
        });
    }

    try {
        consulta = await User.findOneAndUpdate({ _id: id }, params, { new: true }).exec();
        return res.status(200).send({
            status: "success",
            userUpdate: consulta,
            message: "usuario actualizado",
            userToUpdate
        });
    } catch (error) {
        return res.status(500).json({
            status: "error al actualizar",
            message: error
        });
    }

}

const uploadImage = async (req, res) => {

    //comprobar si me llega la imagen o el file0 

    if (!req.file) {
        return res.status(404).send({
            status: "error",
            message: "la peticion no incluye la imagen"
        });
    }

    //conseguir el nombre del archivo
    let image = req.file.originalname

    //sacar la extension del archivo
    const imageSplit = image.split("\.");
    const extension = imageSplit[1];

    //comprobar si extension es correcto
    if (extension != "png" && extension != "jpg" && extension != "jpeg" && extension != "gif") {
        //si el archivo subido no corresponde a las condiciones procedemos a borrarlo 
        const filePath = req.file.path
        //fs.unlink borra el archivo subida 
        const fileDelete = fs.unlinkSync(filePath);
        return res.status(400).send({
            status: "error",
            message: "el archivo subido no corresponde a una imagen"
        })
    }


    //si es correcta se guarda en la base de datos
    try {
        //le pasamos el ide del usuario logeado que en este caso nos llega por el metodo chek.outh que trae el token del usuario logeado con toda la informacion
        //usando el req.user podemos acceder a toda la informacion del usuario generada por el token al logear
        //el segundo parametros pasamos el campo qwue queremos actualiozar en la base de datos en este caso la imagen o avatar
        let consulta = await User.findOneAndUpdate({ _id: req.user.id }, { image: req.file.filename }, { new: true }).exec();

        //devolver una respuesta
        return res.status(200).send({
            status: "success",
            message: "se actualizo la imagen correctamente",
            userUpdate: consulta,
            file: req.file,

        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "error en la subida del avatar",
            error
        });
    }


    // //devolver una respuesta
    // return res.status(200).send({
    //     status: "success",
    //     message: "metodo subir imagen avatar",
    //     user: req.user,
    //     file: req.file,

    // });
}


const avatar = (req, res) => {

    //sacar el parametro de la url
    const file = req.params.file;

    //montar el path real de la imagen
    const filePath = "./upload/avatars/" + file;

    //comprobar que el archivo existe
    fs.stat(filePath, (error, exists) => {

        if (!exists) {
            return res.status(404).send({
                status: "error",
                message: "no existe la imagen"
            });
        }

        //devolver un file
        //sendfile envia el archivo a la base de datos para mostrarlo y con el path tomamos la ruta absoluta del string filepath en este caso que trae el nombre del archivo en string
        return res.sendFile(path.resolve(filePath));

    })


  
}

//metodo para contar la cantidad de publicaciones que tengo usuarios que sigo y seguidores

const counters = async (req, res) => {
    let userId = req.user.id;
   
    console.log(req.params.id);
    if (req.params.id) {
        userId = req.params.id;
        
    }

    try {
        const fallowing = await Fallow.countDocuments({ user: userId });
        const fallowed = await Fallow.countDocuments({ fallowed: userId });
        const publications = await Publicacion.countDocuments({ user: userId });

        return res.status(200).send({
            status: "success",
            message: "cantidad de seguidos, seguidores y publicaciones",
            userId,
            fallowing,
            fallowed,
            publications
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            status: "error",
            message: "error en la petición",
            error
        });
    }
}


//exportar accionmes
module.exports = {
    pruebaUsuario,
    register,
    login,
    profile,
    list,
    updatePorId,
    update,
    uploadImage,
    avatar,
    counters
}

