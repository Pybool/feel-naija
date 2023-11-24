import jwt from 'jsonwebtoken';
import {Request, Response, NextFunction} from 'express';
import Xrequest from '../interfaces/extensions.interface';
import config from '../settings';
import User from '../models/user.model';

const SECRET_KEY:string = process.env.ACCESS_TOKEN_SECRET || ''; 

export const decode = (req:Xrequest, res:Response, next:any) => {
  const reqHeaders:any = req.headers
  if(config.ensureAuth){
    if (!reqHeaders['authorization']) {
      return res.status(400).json({ success: false, message: 'No access token provided' });
    }
  }
  else{
    return next();
  }
  
  const accessToken = reqHeaders.authorization.split(' ')[1];
  try {
    const decoded:any = jwt.verify(accessToken, SECRET_KEY);
    req.userId = decoded.aud;
    req.user = User.findOne({_id:req.userId})
    return next();
  } catch (error:any) {
    return res.status(401).json({ success: false, message: error.message });
  }
}

export function ensureAdmin(req:Xrequest, res:Response, next:NextFunction) {
  const user = req.user;
  if (user && user.admin) {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: User is not an admin' });
  }
}
