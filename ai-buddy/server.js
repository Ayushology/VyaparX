require('dotenv').config();
const app = require('./src/app');

app.listen(3005,()=>{
    console.log("Ai-Buddy Service is running on port 3005");
})