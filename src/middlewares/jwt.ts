import jwt from 'jsonwebtoken';
import {Request, Response, NextFunction} from 'express';
import UserModel from '../models/user.model.js';
import Xrequest from '../interfaces/extensions.interface';


const SECRET_KEY:string = process.env.ACCESS_TOKEN_SECRET || ''; 

export const decode = (req:Xrequest, res:Response, next:any) => {
  if (!req.headers['authorization']) {
    return res.status(400).json({ success: false, message: 'No access token provided' });
  }
  const accessToken = req.headers.authorization.split(' ')[1];
  try {
    const decoded:any = jwt.verify(accessToken, SECRET_KEY);
    req.userId = decoded.aud;
    return next();
  } catch (error:any) {
    return res.status(401).json({ success: false, message: error.message });
  }
}