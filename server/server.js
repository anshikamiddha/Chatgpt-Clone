import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./configs/db.js";
import userRouter from "./routes/userRoutes.js";
import chatRouter from "./routes/chatRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import creditRouter from "./routes/creditRoutes.js";
import { stripeWebhook } from "./controllers/webhooks.js";

dotenv.config();

const app = express();

app.use(cors());

// Conditional JSON parsing (GOOD – keep this)
app.use((req, res, next) => {
  if (
    req.originalUrl === "/api/credit/webhook" ||
    req.originalUrl === "/api/stripe/webhook"
  ) {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// ✅ Root route (IMPORTANT)
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// Stripe webhook (raw body)
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// DB connect (Vercel-safe)
connectDB();

// Routes
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);
app.use("/api/credit", creditRouter);

// ❌ REMOVE app.listen()
// ❌ REMOVE startServer()
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});
export default app;
