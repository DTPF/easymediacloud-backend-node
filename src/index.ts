import config from "./config/config";
import server from "./server";
const mongoose = require('mongoose');

try {
  mongoose.connect(config.db.MONGO_URL)
  server.listen(config.app.PORT, async () => {
    console.log(`Running on ${config.app.URL}...`)
  })
} catch (error) {
  throw new Error()
}