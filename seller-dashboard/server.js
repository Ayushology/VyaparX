require('dotenv').config();
const app = require('./src/app')
const connectToDb = require('./src/config/db');
connectToDb()
app.listen(3007,()=>{
    console.log("Seller-Dashboard is running at port 3007");
});