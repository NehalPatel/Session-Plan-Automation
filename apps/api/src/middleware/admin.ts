import type { NextFunction, Request, Response } from "express";
import { User } from "../models/User.js";

export async function adminMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await User.findById(req.user.userId).select("role");
    if (!user || user.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
