require('dotenv').config();
const connectToDb = require('./src/config/db')
const app = require('./src/app')
connectToDb()
app.listen(3004,()=>{
    console.log("Payment service is running on port 3004");
})