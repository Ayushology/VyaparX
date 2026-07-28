require("dotenv").config();
const connectTodb = require('./src/db/db')
const app = require('./src/app')
connectTodb();
app.listen(3001,()=>{
    console.log("Product Service is running at port 3001");
})