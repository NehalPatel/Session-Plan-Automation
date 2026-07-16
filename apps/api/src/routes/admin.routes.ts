import { Router } from "express";
import type { AdminUserSummary, PlanStatus } from "@session-plan/shared";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";
import { SessionPlan } from "../models/SessionPlan.js";
import { User } from "../models/User.js";
import { normalizeMetadata } from "../utils/planResponse.js";
import { toUserPublic } from "../utils/userResponse.js";

export const adminRouter = Router();

adminRouter.use(authMiddleware, adminMiddleware);

adminRouter.get("/users", async (_req, res, next) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } }).sort({ createdAt: -1 }).lean();
    const plans = await SessionPlan.find().sort({ updatedAt: -1 }).lean();

    const plansByUser = new Map<string, typeof plans>();
    for (const plan of plans) {
      const userId = String(plan.userId);
      const list = plansByUser.get(userId) ?? [];
      list.push(plan);
      plansByUser.set(userId, list);
    }

    const payload: AdminUserSummary[] = users.map((user) => {
      const publicUser = toUserPublic({
        _id: { toString: () => String(user._id) },
        email: user.email,
        name: user.name,
        role: user.role,
      });
      const userPlans = plansByUser.get(publicUser.id) ?? [];

      return {
        id: publicUser.id,
        email: publicUser.email,
        name: publicUser.name,
        role: publicUser.role,
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date(0).toISOString(),
        planCount: userPlans.length,
        plans: userPlans.map((plan) => {
          const metadata = normalizeMetadata(plan.metadata as Parameters<typeof normalizeMetadata>[0]);
          return {
            id: String(plan._id),
            subjectName: metadata.subjectName,
            class: metadata.class,
            semester: metadata.semester,
            divisions: metadata.divisions,
            status: (plan.status ?? "draft") as PlanStatus,
            sessionCount: Array.isArray(plan.rows) ? plan.rows.length : 0,
            updatedAt: plan.updatedAt ? new Date(plan.updatedAt).toISOString() : new Date(0).toISOString(),
          };
        }),
      };
    });

    res.json({ users: payload });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/users/:userId", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).lean();
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const plans = await SessionPlan.find({ userId: user._id }).sort({ updatedAt: -1 }).lean();
    const publicUser = toUserPublic({
      _id: { toString: () => String(user._id) },
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const payload: AdminUserSummary = {
      id: publicUser.id,
      email: publicUser.email,
      name: publicUser.name,
      role: publicUser.role,
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date(0).toISOString(),
      planCount: plans.length,
      plans: plans.map((plan) => {
        const metadata = normalizeMetadata(plan.metadata as Parameters<typeof normalizeMetadata>[0]);
        return {
          id: String(plan._id),
          subjectName: metadata.subjectName,
          class: metadata.class,
          semester: metadata.semester,
          divisions: metadata.divisions,
          status: (plan.status ?? "draft") as PlanStatus,
          sessionCount: Array.isArray(plan.rows) ? plan.rows.length : 0,
          updatedAt: plan.updatedAt ? new Date(plan.updatedAt).toISOString() : new Date(0).toISOString(),
        };
      }),
    };

    res.json(payload);
  } catch (error) {
    next(error);
  }
});
