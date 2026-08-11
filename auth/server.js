require('dotenv').config();
const app = require('./src/app')
const {connect} = require('./src/broker/broker')
const connectTodb = require('./src/db/db')

connectTodb();
connect();
app.listen(3000,()=>{
    console.log("Server is listening at port 3000");
})