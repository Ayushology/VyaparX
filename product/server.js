require("dotenv").config();

const connectToDb = require("./src/db/db");
const app = require("./src/app");

const PORT = process.env.PORT || 3001;

(async () => {
  await connectToDb();

  app.listen(PORT, () => {
    console.log(`Product Service is running at port ${PORT}`);
  });
})();