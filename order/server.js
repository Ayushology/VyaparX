require('dotenv').config()
const connectTodb = require('./src/config/db')
const {connect} = require('./src/broker/broker')
const app = require('./src/app')
connectTodb();
connect();


app.listen(3003,()=>{
    console.log("Order Service is running on port 3003");
})