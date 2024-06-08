const {Schema, model} =require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const FallowSchema = Schema({

    user:{
        type:Schema.ObjectId,
        ref:"User"
    },
    fallowed:{
        type:Schema.ObjectId,
        ref:"User"
    },

    create_at:{
        type:Date,
        default:Date.now
    }

});
FallowSchema.plugin(mongoosePaginate);
module.exports = model("Fallow", FallowSchema, "follows");