import { Router } from "express";
import bcrypt from "bcryptjs";
import { loginSchema, registerSchema } from "@session-plan/shared";
import { User } from "../models/User.js";
import { authMiddleware, signToken } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { toUserPublic } from "../utils/userResponse.js";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash, name, role: "user" });
    const token = signToken({ userId: user._id.toString(), email: user.email });

    res.status(201).json({
      token,
      user: toUserPublic(user),
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = signToken({ userId: user._id.toString(), email: user.email });
    res.json({
      token,
      user: toUserPublic(user),
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(toUserPublic(user));
  } catch (error) {
    next(error);
  }
});
