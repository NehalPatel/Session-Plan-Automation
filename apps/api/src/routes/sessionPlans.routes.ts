import { Router } from "express";
import rateLimit from "express-rate-limit";
import { generateSessionPlanSchema, updateSessionPlanSchema, type PlanMetadata, type SessionPlanRow } from "@session-plan/shared";
import { authMiddleware } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { SessionPlan } from "../models/SessionPlan.js";
import { Syllabus } from "../models/Syllabus.js";
import { User } from "../models/User.js";
import { buildSessionPlanZipFilename } from "@session-plan/shared";
import { buildDivisionExports, buildDownloadArchive } from "../services/export.service.js";
import { buildSessionPlanFromInput } from "../services/sessionPlan.service.js";
import { normalizeMetadata, toPlanResponse } from "../utils/planResponse.js";

export const sessionPlansRouter = Router();

const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

sessionPlansRouter.use(authMiddleware);

sessionPlansRouter.post("/generate", generateLimiter, validateBody(generateSessionPlanSchema), async (req, res, next) => {
  try {
    let parsed = req.body.parsed;
    let syllabusId = req.body.syllabusId;

    if (!parsed && syllabusId) {
      const syllabus = await Syllabus.findOne({ _id: syllabusId, userId: req.user!.userId });
      if (!syllabus) {
        res.status(404).json({ error: "Syllabus not found" });
        return;
      }
      parsed = syllabus.parsed;
    }

    if (!parsed && req.body.rawText) {
      const { parseSyllabusWithAi } = await import("../services/ai.service.js");
      parsed = await parseSyllabusWithAi(req.body.rawText);
    }

    if (!parsed) {
      res.status(400).json({ error: "Parsed syllabus or syllabusId required" });
      return;
    }

    if (!syllabusId && req.body.rawText) {
      const saved = await Syllabus.create({
        userId: req.user!.userId,
        rawText: req.body.rawText,
        parsed,
      });
      syllabusId = saved._id.toString();
    }

    const { rows } = await buildSessionPlanFromInput({ ...req.body, parsed });
    const plan = await SessionPlan.create({
      userId: req.user!.userId,
      syllabusId,
      metadata: req.body.metadata,
      dateRange: req.body.dateRange,
      schedule: req.body.schedule,
      unitSelection: req.body.unitSelection,
      rows,
      status: "draft",
    });

    res.status(201).json(toPlanResponse(plan));
  } catch (error) {
    next(error);
  }
});

sessionPlansRouter.get("/", async (req, res, next) => {
  try {
    const plans = await SessionPlan.find({ userId: req.user!.userId }).sort({ updatedAt: -1 });
    res.json(plans.map((plan) => toPlanResponse(plan)));
  } catch (error) {
    next(error);
  }
});

sessionPlansRouter.get("/:id/docx", async (req, res, next) => {
  try {
    const plan = await SessionPlan.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!plan) {
      res.status(404).json({ error: "Session plan not found" });
      return;
    }

    const user = await User.findById(req.user!.userId);
    const metadata = normalizeMetadata(plan.metadata as PlanMetadata & { division?: string });
    const dateRange = plan.dateRange ?? {
      fromDate: plan.schedule[0]?.date ?? "",
      toDate: plan.schedule[plan.schedule.length - 1]?.date ?? "",
    };

    const files = await buildDivisionExports(
      plan.rows as SessionPlanRow[],
      metadata,
      user?.name ?? "Faculty",
      dateRange,
    );
    const buffer = await buildDownloadArchive(files);

    if (files.length === 1) {
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="${files[0].filename}"`);
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Type");
      res.send(buffer);
      return;
    }

    const zipName = buildSessionPlanZipFilename(metadata, user?.name ?? "Faculty", dateRange);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Type");
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

sessionPlansRouter.get("/:id", async (req, res, next) => {
  try {
    const plan = await SessionPlan.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!plan) {
      res.status(404).json({ error: "Session plan not found" });
      return;
    }
    res.json(toPlanResponse(plan));
  } catch (error) {
    next(error);
  }
});

sessionPlansRouter.patch("/:id", validateBody(updateSessionPlanSchema), async (req, res, next) => {
  try {
    const plan = await SessionPlan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.userId },
      { $set: req.body },
      { new: true },
    );
    if (!plan) {
      res.status(404).json({ error: "Session plan not found" });
      return;
    }
    res.json(toPlanResponse(plan));
  } catch (error) {
    next(error);
  }
});

sessionPlansRouter.delete("/:id", async (req, res, next) => {
  try {
    const plan = await SessionPlan.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId });
    if (!plan) {
      res.status(404).json({ error: "Session plan not found" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
