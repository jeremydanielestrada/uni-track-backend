import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth";
import { eventRouter } from "./routes/event";

dotenv.config();

const PORT = process.env.PORT;

const app = express();
app.use(express.json());
app.use(cookieParser());

//Routes
app.use("/api/auth", authRouter);
app.use("/api/events", eventRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
