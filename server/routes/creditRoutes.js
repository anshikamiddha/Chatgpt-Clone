import express from "express";
const creditRouter = express.Router();
import { getPlans, purchasePlan } from "../controllers/creditController.js";
import { stripeWebhook } from "../controllers/webhooks.js";
import { protect } from "../middlewares/auth.js";   

creditRouter.get('/plans', getPlans);
creditRouter.post('/purchase', protect, purchasePlan);

// Webhook route - must use raw body for Stripe signature verification
// This route should NOT use express.json() middleware
creditRouter.post('/webhook', 
    express.raw({ type: 'application/json' }), 
    stripeWebhook
);

export default creditRouter;