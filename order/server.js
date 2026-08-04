require('dotenv').config()
const connectTodb = require('./src/config/db')

const app = require('./src/app')
connectTodb();


app.listen(3003,()=>{
    console.log("Order Service is running on port 3003");
})