import express from 'express';
import { getuser, loginUser, registerUser } from '../controllers/userController.js';

import { protect } from '../middlewares/auth.js';
const userRouter = express.Router();
userRouter.post('/register',registerUser);
userRouter.post('/login',loginUser);
userRouter.get('/data', protect, getuser);

export default userRouter;