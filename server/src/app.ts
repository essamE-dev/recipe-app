import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { mealdbRouter } from "./routes/mealdb.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: false
  })
);
app.use(compression());
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 90,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again shortly." }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", apiLimiter);
app.use("/api", mealdbRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ error: error.message || "Unexpected server error" });
});
