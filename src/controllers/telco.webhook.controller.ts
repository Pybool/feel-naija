import { Request, Response } from 'express';
import { IWebHook } from '../interfaces/webhook.interface';

const webhooksRoutes:IWebHook = {
telcoReceivedSms: async (req:Request, res:Response) => {
    try {
        return res.status(200).json({ status: true }); 
    } catch (error) {
      return res.status(500).json({ status: false, error: error })
    }
  },
}

export default webhooksRoutes