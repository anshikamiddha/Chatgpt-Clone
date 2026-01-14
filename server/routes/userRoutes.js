import express from 'express';
import { getuser, loginUser, registerUser } from '../controllers/userController.js';
import { getPublishedImages } from '../controllers/userController.js';
import { protect } from '../middlewares/auth.js';
const userRouter = express.Router();
userRouter.post('/register',registerUser);
userRouter.post('/login',loginUser);
userRouter.get('/data', protect, getuser);
userRouter.get('/published-images', getPublishedImages);

export default userRouter;