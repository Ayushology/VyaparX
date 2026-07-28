require("dotenv").config();
const connectToDb = require('./src/db/db')
const app = require('./src/app')
connectToDb();
app.listen(3001,()=>{
    console.log("Product Service is running at port 3001");
})