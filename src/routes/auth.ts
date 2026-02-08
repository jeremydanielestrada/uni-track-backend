import express from "express";
import { login, register, logout } from "../controller/auth-controller.js";
import { authenticate } from "../middleware/auth-middleware.js";
import type { AuthRequest } from "../middleware/auth-middleware.js";
export const authRouter = express.Router();

authRouter.post("/register", register);

authRouter.post("/login", login);

authRouter.post("/logout", logout);

authRouter.get("/governor", authenticate, (req: AuthRequest, res) => {
  res.json({ governor: req.governor });
});
