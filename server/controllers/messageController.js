import Chat from "../models/Chat.js";
import User from "../models/user.js";
import axios from "axios";
import imagekit from "../configs/imageKit.js";
import openai from "../configs/openai.js";
import ImageKit from "imagekit";

/* ================= TEXT MESSAGE ================= */

export const textMessageController = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.user.credits < 1) {
      return res.status(400).json({
        success: false,
        message: "Insufficient credits",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "GEMINI_API_KEY is not configured",
      });
    }

    const { chatId, prompt } = req.body;

    if (!prompt || !chatId) {
      return res.status(400).json({
        success: false,
        message: "chatId and prompt are required",
      });
    }

    const chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Call Gemini with a simple text prompt (must be an array)
    const result = await openai.generateContent([prompt]);
    const response = await result.response;
    const text = response.text();

    // Add the user message to chat
    chat.messages.push({
      isImage: false,
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    });

    const reply = {
      isImage: false,
      role: "assistant",
      content: text,
      timestamp: Date.now(),
    };

    chat.messages.push(reply);
    await chat.save();

    await User.updateOne(
      { _id: userId },
      { $inc: { credits: -1 } }
    );

    res.status(200).json({
      success: true,
      reply,
    });

  } catch (error) {
    console.error("Text message error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", JSON.stringify(error, null, 2));
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message || String(error),
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

/* ================= IMAGE MESSAGE ================= */

export const imageMessageController = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.user.credits < 2) {
      return res.status(400).json({
        success: false,
        message: "Insufficient credits",
      });
    }

    // Validate ImageKit configuration with detailed checks
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY?.trim();
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT?.trim();

    if (!publicKey || !privateKey || !urlEndpoint) {
      console.error("ImageKit configuration missing:", {
        hasUrlEndpoint: !!urlEndpoint,
        hasPublicKey: !!publicKey,
        hasPrivateKey: !!privateKey,
      });
      return res.status(500).json({
        success: false,
        message: "ImageKit configuration is missing. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in your .env file.",
      });
    }

    // Validate URL endpoint format
    if (!urlEndpoint.startsWith("https://")) {
      return res.status(500).json({
        success: false,
        message: "Invalid IMAGEKIT_URL_ENDPOINT. It should start with 'https://' (e.g., https://ik.imagekit.io/your_id)",
      });
    }

    const { chatId, prompt, isPublished } = req.body;

    if (!prompt || !chatId) {
      return res.status(400).json({
        success: false,
        message: "chatId and prompt are required",
      });
    }

    const chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    chat.messages.push({
      isImage: false,
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    });

    const encodedPrompt = encodeURIComponent(prompt);

    const generatedImageUrl =
      `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/chatgpt/${Date.now()}.png?tr=w-800,h-800`;

    console.log("Generating image from URL:", generatedImageUrl);

    let aiImageResponse;
    try {
      aiImageResponse = await axios.get(generatedImageUrl, {
        responseType: "arraybuffer",
        timeout: 60000, // 60 second timeout
      });
    } catch (axiosError) {
      console.error("Error fetching generated image:", axiosError.message);
      if (axiosError.response) {
        console.error("Response status:", axiosError.response.status);
        console.error("Response data:", axiosError.response.data?.toString());
      }
      throw new Error(`Failed to generate image: ${axiosError.message}`);
    }

    if (!aiImageResponse.headers["content-type"]?.includes("image")) {
      console.error("Response content-type:", aiImageResponse.headers["content-type"]);
      console.error("Response data preview:", aiImageResponse.data?.toString().substring(0, 200));
      throw new Error("ImageKit AI generation failed - response is not an image");
    }

    const base64Image = `data:image/png;base64,${Buffer.from(
      aiImageResponse.data
    ).toString("base64")}`;

    // Re-initialize ImageKit with fresh credentials to ensure they're loaded
    let uploadResponse;
    try {
      console.log("Attempting to upload to ImageKit...");
      
      // Create a fresh ImageKit instance with current env variables
      const freshImagekit = new ImageKit({
        publicKey: publicKey,
        privateKey: privateKey,
        urlEndpoint: urlEndpoint,
      });

      console.log("ImageKit instance created with:", {
        urlEndpoint: urlEndpoint,
        publicKeyPrefix: publicKey.substring(0, 10) + "...",
        hasPrivateKey: !!privateKey,
      });

      uploadResponse = await freshImagekit.upload({
        file: base64Image,
        fileName: `chatgpt_${Date.now()}.png`,
        folder: "chatgpt/images",
      });

      if (!uploadResponse || !uploadResponse.url) {
        throw new Error("ImageKit upload failed - no URL returned in response");
      }

      console.log("✓ Image uploaded successfully to ImageKit:", uploadResponse.url);
    } catch (uploadError) {
      console.error("=== IMAGEKIT UPLOAD ERROR ===");
      console.error("Error message:", uploadError.message);
      console.error("Error code:", uploadError.code);
      console.error("Error details:", {
        message: uploadError.message,
        name: uploadError.name,
        stack: uploadError.stack?.substring(0, 500),
      });
      
      // Check for specific authentication errors
      const errorMsg = uploadError.message?.toLowerCase() || "";
      if (
        errorMsg.includes("authenticated") ||
        errorMsg.includes("authentication") ||
        errorMsg.includes("unauthorized") ||
        errorMsg.includes("invalid credentials")
      ) {
        return res.status(401).json({
          success: false,
          message: "ImageKit authentication failed. Please verify your credentials:",
          details: [
            "1. Check IMAGEKIT_PUBLIC_KEY in your .env file",
            "2. Check IMAGEKIT_PRIVATE_KEY in your .env file", 
            "3. Check IMAGEKIT_URL_ENDPOINT in your .env file (format: https://ik.imagekit.io/your_id)",
            "4. Make sure there are no extra spaces or quotes in the values",
            "5. Restart your server after updating .env file",
            "6. Verify credentials in ImageKit dashboard: https://imagekit.io/dashboard"
          ],
          error: "Authentication error - verify your ImageKit account credentials",
        });
      }

      if (errorMsg.includes("invalid") || errorMsg.includes("bad request")) {
        return res.status(400).json({
          success: false,
          message: "Invalid ImageKit request. Please check your configuration.",
          error: uploadError.message,
        });
      }

      throw new Error(`Failed to upload image: ${uploadError.message || "Unknown error"}`);
    }

    const reply = {
      isImage: true,
      role: "assistant",
      content: uploadResponse.url,
      timestamp: Date.now(),
      isPublished,
    };

    chat.messages.push(reply);
    await chat.save();

    await User.updateOne(
      { _id: userId },
      { $inc: { credits: -2 } }
    );

    res.json({
      success: true,
      reply,
    });

  } catch (error) {
    console.error("Image message error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", JSON.stringify(error, null, 2));
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message || String(error),
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
