import Chat from "../models/Chat.js";

export const createChat = async (req, res) => {
    try {
        const userId = req.user._id;
        const chatData={
            userId,
            messages:[],
            name:"New Chat",
            userName: req.user.name,
        };
        const chat = await Chat.create(chatData);
        return res.status(201).json({ success: true, message: "Chat created successfully", chat });
    } catch (error) {
        console.error("CREATE CHAT ERROR:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getChats = async (req, res) => {
    try {
        const userId = req.user._id;
        const chats = await Chat.find({ userId }).sort({ updatedAt: -1 });
        return res.status(200).json({ success: true, chats });
    } catch (error) {
        console.error("GET CHATS ERROR:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const deleteChat = async (req, res) => {
    try {
        const {chatId} = req.body;
        const userId = req.user._id;    
        const chat = await Chat.findOneAndDelete({ _id: chatId, userId });
        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat not found" });
        }
        return res.status(200).json({ success: true, message: "Chat deleted successfully" });
    } catch (error) {
        console.error("DELETE CHAT ERROR:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }   
};