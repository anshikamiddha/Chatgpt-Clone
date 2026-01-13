import Stripe from "stripe";
import Transaction from "../models/Transaction.js";
import User from "../models/user.js";

// Initialize Stripe only if API key is available
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
    console.warn("⚠️  WARNING: STRIPE_SECRET_KEY is not set. Webhook functionality will not work.");
}

export const stripeWebhook = async (req, res) => {
    // Check if Stripe is configured
    if (!stripe) {
        console.error("Stripe is not configured. Cannot process webhook.");
        return res.status(500).json({ 
            success: false, 
            message: "Stripe is not configured" 
        });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error("STRIPE_WEBHOOK_SECRET is not set in environment variables.");
        return res.status(500).json({ 
            success: false, 
            message: "Webhook secret is not configured" 
        });
    }

    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
        console.error("Missing stripe-signature header");
        return res.status(400).json({ 
            success: false, 
            message: "Missing stripe-signature header" 
        });
    }
    
    let event;

    try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.error("Webhook signature verification failed:", error.message);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    console.log("Webhook event received:", event.type);

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                console.log("Checkout session completed:", session.id);

                // Extract metadata from session
                const { transactionId, userId, planId, appId } = session.metadata || {};

                // Verify this is for our app
                if (appId !== 'chatgptclone') {
                    console.log("Ignored event: Invalid app ID");
                    return res.json({ received: true, message: "Ignored event: Invalid app" });
                }

                if (!transactionId) {
                    console.error("Transaction ID missing in session metadata");
                    return res.status(400).json({ 
                        success: false, 
                        message: "Transaction ID missing" 
                    });
                }

                // Find the transaction
                const transaction = await Transaction.findById(transactionId);

                if (!transaction) {
                    console.error("Transaction not found:", transactionId);
                    return res.status(404).json({ 
                        success: false, 
                        message: "Transaction not found" 
                    });
                }

                // Check if already processed
                if (transaction.isPaid) {
                    console.log("Transaction already processed:", transactionId);
                    return res.json({ 
                        received: true, 
                        message: "Transaction already processed" 
                    });
                }

                // Verify payment was successful
                if (session.payment_status === 'paid') {
                    // Update transaction as paid
                    transaction.isPaid = true;
                    await transaction.save();

                    // Add credits to user account
                    await User.findByIdAndUpdate(
                        transaction.userId,
                        { $inc: { credits: transaction.credits } }
                    );

                    console.log(`✅ Credits added: ${transaction.credits} credits to user ${transaction.userId}`);
                    console.log(`✅ Transaction ${transactionId} marked as paid`);

                    return res.json({ 
                        success: true, 
                        message: "Payment processed successfully",
                        transactionId: transaction._id,
                        creditsAdded: transaction.credits
                    });
                } else {
                    console.warn("Payment status is not 'paid':", session.payment_status);
                    return res.json({ 
                        received: true, 
                        message: "Payment not completed yet" 
                    });
                }
            }

            case 'checkout.session.async_payment_succeeded': {
                const session = event.data.object;
                console.log("Async payment succeeded:", session.id);
                
                // Handle async payment success (similar to above)
                const { transactionId, appId } = session.metadata || {};
                
                if (appId !== 'chatgptclone') {
                    return res.json({ received: true });
                }

                const transaction = await Transaction.findById(transactionId);
                if (transaction && !transaction.isPaid) {
                    transaction.isPaid = true;
                    await transaction.save();

                    await User.findByIdAndUpdate(
                        transaction.userId,
                        { $inc: { credits: transaction.credits } }
                    );

                    console.log(`✅ Async payment: Credits added to user ${transaction.userId}`);
                }

                return res.json({ success: true });
            }

            case 'checkout.session.async_payment_failed': {
                const session = event.data.object;
                console.log("Async payment failed:", session.id);
                
                const { transactionId, appId } = session.metadata || {};
                
                if (appId === 'chatgptclone' && transactionId) {
                    console.error(`❌ Payment failed for transaction: ${transactionId}`);
                    // You might want to update transaction status or notify user
                }

                return res.json({ received: true });
            }

            case 'payment_intent.succeeded': {
                // Handle direct payment intents if needed
                console.log("Payment intent succeeded:", event.data.object.id);
                return res.json({ received: true });
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
                return res.json({ received: true });
        }
    } catch (error) {
        console.error("Error processing webhook:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Webhook processing failed",
            error: error.message 
        });
    }
};
