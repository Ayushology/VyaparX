require("dotenv").config();

const {connect} = require('./src/broker/broker')
const connectToDb = require("./src/db/db");
const app = require("./src/app");
const PORT = process.env.PORT || 3001;

(async () => {
  await connectToDb();
  await connect();
  app.listen(PORT, () => {
    console.log(`Product Service is running at port ${PORT}`);
  });
})();