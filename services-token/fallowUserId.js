const Fallow = require("../models/Follow");

const fallowUserIds = async (identityUserId) => {
    //buscar usuarios que estoy siguiendo
    try {
        let fallowing = await Fallow.find({ "user": identityUserId })
            .select({ fallowed: 1, _id: 0 });

        let fallowerds = await Fallow.find({ "fallowed": identityUserId })
            .select({ user: 1, _id: 0 });

        //procesar array de identificadores
        let fallowingClean = [];

        let fallowerdsClean = [];

        fallowing.forEach(element => {
            fallowingClean.push(element.fallowed);
        });

        fallowerds.forEach(element => {
            fallowerdsClean.push(element.user);
        });

        return {
            fallowing: fallowingClean,
            fallowerds: fallowerdsClean
        }
    } catch (error) {
        return { error };
    }


}

const fallowThisUser = async (identityUserId, profileUserId) => {

    try {
        //comprobar si lo sigo a el
        let loSigo =await Fallow.findOne({ "fallowed": profileUserId, "user": identityUserId });

        //comprobar si me sigue a mi
        let meSigue = await Fallow.findOne({ "user": profileUserId, "fallowed": identityUserId });

        return {
            loSigo,
            meSigue
        };
    
    } catch (error) {
        console.log("aa")
        return error;
    }



}

module.exports = {
    fallowUserIds,
    fallowThisUser
}