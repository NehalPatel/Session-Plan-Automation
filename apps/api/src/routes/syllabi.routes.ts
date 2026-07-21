import { Router } from "express";
import rateLimit from "express-rate-limit";
import { parseSyllabusRequestSchema, saveSyllabusSchema } from "@session-plan/shared";
import { authMiddleware } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { Syllabus } from "../models/Syllabus.js";
import { parseSyllabus } from "../services/syllabus.service.js";

export const syllabiRouter = Router();

const parseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

syllabiRouter.use(authMiddleware);

syllabiRouter.post("/parse", parseLimiter, validateBody(parseSyllabusRequestSchema), async (req, res, next) => {
  try {
    const parsed = parseSyllabus(req.body.rawText);
    res.json({ parsed });
  } catch (error) {
    next(error);
  }
});

syllabiRouter.post("/", validateBody(saveSyllabusSchema), async (req, res, next) => {
  try {
    const doc = await Syllabus.create({
      userId: req.user!.userId,
      rawText: req.body.rawText,
      parsed: req.body.parsed,
    });
    res.status(201).json({
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      rawText: doc.rawText,
      parsed: doc.parsed,
      createdAt: doc.createdAt?.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

syllabiRouter.get("/", async (req, res, next) => {
  try {
    const docs = await Syllabus.find({ userId: req.user!.userId }).sort({ createdAt: -1 });
    res.json(
      docs.map((doc) => ({
        id: doc._id.toString(),
        userId: doc.userId.toString(),
        rawText: doc.rawText,
        parsed: doc.parsed,
        createdAt: doc.createdAt?.toISOString(),
      })),
    );
  } catch (error) {
    next(error);
  }
});

syllabiRouter.get("/:id", async (req, res, next) => {
  try {
    const doc = await Syllabus.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!doc) {
      res.status(404).json({ error: "Syllabus not found" });
      return;
    }
    res.json({
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      rawText: doc.rawText,
      parsed: doc.parsed,
      createdAt: doc.createdAt?.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});
