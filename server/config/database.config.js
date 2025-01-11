import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const connect = () => {
  const uri = process.env.MONGODB_URI;
  mongoose
    .connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected..."))
    .catch((err) => {
      console.error("MongoDB connection error:", err);
      process.exit(1);
    });
};
