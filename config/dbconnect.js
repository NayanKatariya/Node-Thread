const mongoose = require("mongoose");
const { updateTokens } = require("../service/token.service");

const connectWithRetry = () => {
  mongoose.connect(process.env.MONGODB_URL, {
    serverSelectionTimeoutMS: 5000, 
  })
  .then(async() => {
    console.log("Database Connected!!");
    await updateTokens();
  })
  .catch(err => {
    console.error("MongoDB connection unsuccessful, retry after 5 seconds.", err);
    setTimeout(connectWithRetry, 10000);
  });
};

connectWithRetry();

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected! Attempting to reconnect...");
  connectWithRetry();
});