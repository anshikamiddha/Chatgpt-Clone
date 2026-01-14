import express from 'express';
import { createChat, deleteChat, getChats } from '../controllers/chatController.js';
import { protect } from '../middlewares/auth.js';
const chatRouter = express.Router();

// Create a chat (use POST so it matches the client call)
chatRouter.post('/create', protect, createChat);

// List chats for the signed-in user
chatRouter.get('/get', protect, getChats);

// Delete a chat
chatRouter.post('/delete', protect, deleteChat);

export default chatRouter;