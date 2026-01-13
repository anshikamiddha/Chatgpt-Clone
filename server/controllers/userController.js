import User from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Chat from "../models/Chat.js";
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
    try{
        const publishedImagesMessages=await Chat.aggregate([
          {$unwind: "$messages"},
          {
            $match: {
              "messages.isImage": true,
              "messages.isPublished": true,
            }
          },
          {
            $project: {
              _id: 0,
              imageUrl:"$messages.content",
              userName:"$userName",
            }
          },
          {
            $group: {
              _id: "$userName",
              images: { $push: "$imageUrl" },
            }
          }
        ]);
        res.json({ success: true, publishedImagesMessages: publishedImagesMessages.reverse() });
    
    }
    catch(error){
        console.error("Get published images error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
}