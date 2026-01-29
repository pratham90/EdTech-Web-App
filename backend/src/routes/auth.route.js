import express from 'express';
import {signup,login,logout,checkAuth} from '../controllers/auth.controller.js'
import {protectRoute} from '../middleware/auth.middleware.js';

const route = express.Router();

route.post('/signup',signup);
route.post('/login',login);
route.post('/logout',logout);
route.get('/check',protectRoute,checkAuth);

export default route;