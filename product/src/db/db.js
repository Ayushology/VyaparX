const mongoose = require('mongoose')
async function connectTodb(params) {
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDb Connected");
        
    }catch(err){
        console.error("MongoDb Connection Error", err);
    }
}

module.exports = connectTodb;