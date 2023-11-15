import { Request, Response } from 'express';
import UploadService from '../services/upload.services';

const uploadsControllers = {
  newUploadRequest : (async (req: Request, res: Response)=>{
    try {
      const uploadService = new UploadService()
      const savedstatus:Boolean = await uploadService.processAndSave(req)
      if (savedstatus){
        res.status(201).json({ message: 'FormData stored successfully' });
      }
      else{
        res.status(422).json({ message: 'Request did not process correctly to completion' });
      }
      
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: 'Internal Server Error' });
    }
  })
}

export default uploadsControllers;