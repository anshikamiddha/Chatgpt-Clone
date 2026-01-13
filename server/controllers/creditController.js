import Transaction from "../models/Transaction.js";
import Stripe from "stripe";

const plans=[
    {
        _id: "basic",
        name: "Basic",
        price: 10,
        credits: 100,
        features: ['100 text generations', '50 image generations', 'Standard support', 'Access to basic models']
    },
    {
        _id: "pro",
        name: "Pro",
        price: 20,
        credits: 500,
        features: ['500 text generations', '200 image generations', 'Priority support', 'Access to pro models', 'Faster response time']
    },
    {
        _id: "premium",
        name: "Premium",
        price: 30,
        credits: 1000,
        features: ['1000 text generations', '500 image generations', '24/7 VIP support', 'Access to premium models', 'Dedicated account manager']
    }
]

export const getPlans = async (req, res) => {
    try{
        res.json({success: true, plans});
    }
    catch(error){
        res.status(500).json({success: false, message: error.message});
    }
}

// Initialize Stripe only if API key is available
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
    try {
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        console.log("✅ Stripe initialized successfully");
    } catch (error) {
        console.error("❌ Error initializing Stripe:", error.message);
    }
} else {
    console.warn("⚠️  WARNING: STRIPE_SECRET_KEY is not set in .env file. Stripe functionality will not work.");
    console.warn("   To enable Stripe payments, add STRIPE_SECRET_KEY=sk_test_... to your .env file");
}

export const purchasePlan=async(req,res)=>{
    try{
        console.log("📦 Purchase plan request received");
        const {planId} = req.body;
        console.log("Plan ID:", planId);
        
        if (!planId) {
            return res.status(400).json({
                success: false, 
                message: "planId is required in request body"
            });
        }

        const userId=req.user._id;
        console.log("User ID:", userId);
        
        const plan=plans.find(plan => plan._id === planId);
        if(!plan){
            return res.status(404).json({success: false, message: "Plan not found"});
        }
        
        console.log("Selected plan:", plan.name, "- Price: $", plan.price);
        
        const transaction=await Transaction.create({
            userId:userId,
            amount:plan.price,
            planId:plan._id,
            credits:plan.credits,
            isPaid:false,
        });
        console.log("✅ Transaction created:", transaction._id);

        // If Stripe is not configured, return a mock response for testing
        if (!stripe) {
            console.warn("⚠️  Stripe not configured - returning mock payment URL");
            const mockUrl = `${req.headers.origin || 'http://localhost:5173'}/loading?transactionId=${transaction._id}`;
            console.log("Mock URL:", mockUrl);
            return res.json({
                success: true, 
                url: mockUrl,
                message: "Mock payment - Stripe not configured. Set STRIPE_SECRET_KEY in .env for real payments.",
                transaction,
                isMock: true
            });
        }

        console.log("💳 Creating Stripe checkout session...");

        const {origin}=req.headers;
        const session=await stripe.checkout.sessions.create({
            line_items:[{
                price_data:{
                    currency:"usd",
                    unit_amount:plan.price*100,
                    product_data:{
                        name:plan.name,
                        description: `${plan.credits} credits - ${plan.features.join(', ')}`
                    },

                },
                quantity:1,
            }],
            mode:"payment",
            success_url:`${origin}/loading?transactionId=${transaction._id}`,
            cancel_url:`${origin}/credits`,
            metadata:{
                transactionId:transaction._id.toString(),
                userId:userId.toString(),
                planId:plan._id,
                appId:'chatgptclone'
            },
            expires_at:Math.floor(Date.now()/1000)+30*60,
        });
        
        console.log("Stripe checkout session created:", session.id);
        console.log("Checkout URL:", session.url);
        
        res.json({
            success: true, 
            url: session.url, 
            sessionId: session.id,
            message: "Plan purchased successfully", 
            transaction
        });
    }
    catch(error){
        console.error("Purchase plan error:", error);
        res.status(500).json({
            success: false, 
            message: error.message || "Failed to process payment",
            error: process.env.NODE_ENV === "development" ? error.stack : undefined
        });
    }
}