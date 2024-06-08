const Publication = require("../models/Publication");

//libreria fs permite borrar un archivo de una ruta, en este caso lo usamos para borrar en el metodo imagen
//en caso de que la imagen no tenga el formato correcto
const fs = require("fs");
//path nmos permite mostrar imagenes en los endpoint ya que convierte el string en una ruta en este caso el string de la imagen
const path = require("path")

//importar servicios 
const fallowService = require("../services-token/fallowUserId");

// Acciones de prueba
const pruebaPublication = (req, resp) => {
    return resp.status(200).send({
        message: "mensaje enviado desde :controllers/publication.js"
    });
}

//guardar publicaciones
const savePublication = async (req, res) => {
  // Obtener el id de la sesión del usuario
  let identityId = req.user.id;

  // Obtener texto de la publicación
  let texto = req.body.text;
  

  // Validar que el texto no esté vacío
  if (!texto) {
    return res.status(400).send({
      status: "error",
      message: "Falta el texto de la publicación"
    });
  }

  // Crear una nueva publicación con los datos recibidos
  let newPublication = new Publication({
    user: identityId,
    text: texto,
  });

  try {
    // Guardar la nueva publicación en la base de datos
    const publicationStored = await newPublication.save();
    return res.status(200).send({
      status: "success",
      message: "Publicación guardada con éxito",
      userSession: req.user,
      publication: publicationStored
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al guardar la publicación",
      error: error
    });
  }
}

//sacar una publicacion en concreto
const listOne = async (req, res) => {
    //sacar el id de la publicacion para mostrarla
    const publicationId = req.query.id;

    //buscar la publicacion con el id obtenido por parametro de url
    try {

        if (!publicationId) {
            return res.status(404).send({
                status: "error",
                message: "no se encontro la publicacion, id incorrecto"
            });
        }
        let consulta = await Publication.findById(publicationId);
        return res.status(200).send({
            status: "success",
            message: "Publicacion encontrada por su id",
            publication: consulta
        })
    } catch (error) {
        return res.status(400).send({
            status: "error",
            message: "error en la peticion",
            error
        });
    }



    // return res.status(200).send({
    //     status: "success",
    //     message: "metodo mostrar 1 publicacion",
    // });
}


//eliminar publicaciones

const remove = async (req, res) => {
    const publicationId = req.query.id;

    try {
        if (!publicationId) {
            return res.status(400).send({
                status: "error",
                message: "no existe la publicacion con el id ingresado",
            });
        }
        let consulta = await Publication.findOneAndDelete({ user: req.user.id, _id: publicationId });
        return res.status(200).send({
            status: "success",
            message: "publicacion eliminada",
            publication: consulta,
            userSession: req.user
        });

    } catch (error) {
        return res.status(400).send({
            status: "error",
            message: "error en la peticion",
            error
        });
    }



}

//listar todas las publicaciones de un usuario en concreto
const userList = async (req, res) => {

    let itemPerPage = 8;
    let query = {};
    //sacar el id de usuario
    let userId = req.query.id;
    //controlar la pagina
    let page = parseInt(req.query.page) || 1;

    //opciones del metodo paginate
    let option = {
        page: page,
        limit: itemPerPage,
        sort: { _id: -1 },
        collation: { locale: "es" },
        populate: {
            path: "user",
        },
        //populate: {"user"}
    }
    //darle valor a la query para que condicione la busqueda
    query["user"] = userId;
    //find, populate, ordenar, paginar
    try {
        if (!query) {
            return res.status(404).send({
                status: "error",
                message: "error al listar, id no recibida",
            });
        }
        //devolver un resultado
        const consulta = await Publication.paginate(query, option);
        const total = await Publication.countDocuments(query);
        return res.status(200).send({
            status: "success",
            message: "lista de publicaciones",
            publicaciones: consulta.docs,
            itemPerPage,
            total,
            pages: Math.ceil(total / itemPerPage)
        });

    } catch (error) {
        return res.status(400).send({
            status: "error",
            message: "error al mandar la peticion",
            error
        });
    }
    // return res.status(200).send({
    //     status: "success",
    //     message: "metodo para lsitar todas las publicaciones de 1 usuario",
    // });
}

//subir ficheros 

const uploadImage = async (req, res) => {

    //sacar el id de la publicacion por parametro url
    let idPublication = req.query.id;
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
        let consulta = await Publication.findOneAndUpdate({ user: req.user.id, _id: idPublication }, { file: req.file.filename }, { new: true }).exec();

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
}



//devolver archivos multimedia
const media = (req, res) => {

    //sacar el parametro de la url
    const file = req.params.file;

    //montar el path real de la imagen
    const filePath = "./upload/publications/" + file;

    //comprobar que el archivo existe
    fs.stat(filePath, (error, exists) => {

        if (!exists) {
            return res.status(404).send({
                status: "error",
                message: "no existe la imagen",
                error
            });
        }

        //devolver un file
        //sendfile envia el archivo a la base de datos para mostrarlo y con el path tomamos la ruta absoluta del string filepath en este caso que trae el nombre del archivo en string
        return res.sendFile(path.resolve(filePath));

    });
}

//listar todas las publicaciones de usuarios que sigo (feed)
const feed = async (req, res) => {
    //recibimos la pagina por parametro url en caso de no recibirla por defecto es la 1
    let page = parseInt(req.query.page) || 1;

    //establecer numero de elementos por pagina
    let itemsPerPage = 5;
    try {
        //sacar un array de identificadores de usuarios que sigo pero con la condicion de que yo a esos usuarios los siga
        const myFallows = await fallowService.fallowUserIds(req.user.id);

        // find a publicaciones usando operador in, ordenar, popular, paginar

        //creamos un objeto llamado option el cual tendra las opciones para configurar el paginate
        let options = {
            page: page,
            limit: itemsPerPage,
            sort: { _id: -1 },
            collation: {
                locale: "es"
            },
            populate: {
                path: "user",
                select:{password:0, roll:0, __v:0,email:0}
            }
        };

        let publications = await  Publication.paginate({
            user:myFallows.fallowing
        },options)

        //sacamos el total de item o publicaciones en este caso que nos trae la consulta 
        const total = await Publication.countDocuments({ user: myFallows.fallowing });


        return res.status(200).send({
            status: "success",
            message: "metodo listar publicaciones de usuarios que sigo",
            fallowing: myFallows.fallowing,
            publications:publications.docs,
            page,
            itemsPerPage,
            total,
            pages: Math.ceil(total / itemsPerPage),

        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "error en la peticion",
            error

        });
    }




}

//exportar accionmes
module.exports = {
    pruebaPublication,
    savePublication,
    listOne,
    remove,
    userList,
    uploadImage,
    media,
    feed
}