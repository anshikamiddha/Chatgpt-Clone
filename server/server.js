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
console.log("JWT_SECRET:", process.env.JWT_SECRET);

const app = express();

app.use(cors());

// Webhook routes need raw body, so we'll handle JSON parsing conditionally
// Apply JSON parsing to all routes except webhook routes
app.use((req, res, next) => {
    if (req.originalUrl === '/api/credit/webhook' || req.originalUrl === '/api/stripe/webhook') {
        // Skip JSON parsing for webhook routes
        next();
    } else {
        // Apply JSON parsing for all other routes
        express.json()(req, res, next);
    }
});
// Stripe webhook route - must use raw body for signature verification
app.post("/api/stripe/webhook", express.raw({ type: 'application/json' }), stripeWebhook);
const startServer = async () => {
  try {
    await connectDB();

    app.use("/api/user", userRouter);
    app.use("/api/chat", chatRouter);
    app.use("/api/message", messageRouter);
    app.use("/api/credit", creditRouter);
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server start failed:", error);
    process.exit(1);
  }
};

startServer();
export default app;