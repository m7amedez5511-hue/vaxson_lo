import "dotenv/config";
import app from "./App/app.js";
import connectMongoDB from "./lib/mongodb.js";
import { registerGracefulShutdown } from "./lib/lifecycle.js";

const PORT = process.env.PORT || 3000;

registerGracefulShutdown("api");

connectMongoDB()
  .then(() => {
    console.log("Connected to MongoDB successfully.");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`docs available at http://localhost:${PORT}/api/v1/docs`);
});
