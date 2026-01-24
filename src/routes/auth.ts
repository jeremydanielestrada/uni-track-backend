import express from "express";
import { login, register, logout } from "../controller/auth-controller";

export const authRouter = express.Router();

authRouter.post("/register", register);

authRouter.post("/login", login);

authRouter.post("/logout", logout);
