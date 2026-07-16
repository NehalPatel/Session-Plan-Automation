import cors from "cors";
import express from "express";
import { connectDatabase } from "./config/db.js";
import { config } from "./config/env.js";
import { errorHandler } from "./middleware/validate.js";
import { adminRouter } from "./routes/admin.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { sessionPlansRouter } from "./routes/sessionPlans.routes.js";
import { syllabiRouter } from "./routes/syllabi.routes.js";

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    exposedHeaders: ["Content-Disposition", "Content-Type"],
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/syllabi", syllabiRouter);
app.use("/session-plans", sessionPlansRouter);

app.use(errorHandler);

async function start() {
  await connectDatabase(config.mongoUri);
  app.listen(config.port, () => {
    console.log(`API listening on port ${config.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
