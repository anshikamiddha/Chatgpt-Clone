import User from "../models/user.js";
import Chat from "../models/Chat.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });
};

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits,
      },
    });
  } catch (error) {
    console.log("REGISTER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try{
        const user = await User.findOne({ email });
        if(user ){
            const isMatch=await bcrypt.compare(password, user.password);
            if(isMatch){
                const token = generateToken(user._id);
                return res.json({ success:true, token });
            }
            else{
                return res.status(401).json({ success:false, message: "Invalid email or password" });
            }
        }
        else{
            return res.status(401).json({ success:false, message: "Invalid email or password" });
        }
    }
    catch(error){
        return res.status(500).json({ success:false, message: "Server Error" });
    }
}

export const getuser= async (req, res) => {
    try{
        const user=req.user;
        res.json({ success:true, user });
    }
    catch(error){
        return res.status(500).json({ success:false, message: "Server Error" });
    }       
}
export const getPublishedImages = async (req, res) => {
    try {
        // Find all chats and extract published images from messages
        const chats = await Chat.find({}).populate('userId', 'name email');
        
        const publishedImages = [];
        
        // Loop through all chats and find published image messages
        chats.forEach(chat => {
            chat.messages.forEach(message => {
                if (message.isImage && message.isPublished) {
                    publishedImages.push({
                        imageUrl: message.content,
                        userName: chat.userName || (chat.userId?.name) || 'Unknown',
                        userId: chat.userId?._id || chat.userId,
                        createdAt: message.timestamp,
                        chatId: chat._id
                    });
                }
            });
        });
        
        // Sort by creation date (newest first)
        publishedImages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json({ success: true, images: publishedImages });
    } catch (error) {
        console.error("Error fetching published images:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};