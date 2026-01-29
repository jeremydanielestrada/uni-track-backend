import express from "express";
import { login, register, logout } from "../controller/auth-controller";
import { authenticate } from "../middleware/auth-middleware";
import type { AuthRequest } from "../middleware/auth-middleware";
export const authRouter = express.Router();

authRouter.post("/register", register);

authRouter.post("/login", login);

authRouter.post("/logout", logout);

authRouter.get("/governor", authenticate, (req: AuthRequest, res) => {
  res.json({ governor: req.governor });
});
