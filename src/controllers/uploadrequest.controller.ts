import logger from '../logger';
import { Request, Response } from 'express';
import UploadService from '../services/uploadservices';
import {IUpload, IprocessAndSave} from '../interfaces/upload.interface';
import utils from '../helpers/misc';
import validators from '../helpers/validators/validators';

const uploadsControllers:IUpload = {
  newUploadRequest : (async (req: Request, res: Response)=>{
    try {
      const validation = validators.newUploadRequest(req.body)
      const hasPendingAuthorization:boolean = false //Implement the function check later

      if (validation.success && !hasPendingAuthorization){
        const uploadService = new UploadService()
        const process:IprocessAndSave = await uploadService.processAndSave(req)
        if (process.status && process.message=='trueCommit'){
          utils.telcoSimulate(4000,req.body.phone).then(async(telcoResponse:any)=>{
            console.log(telcoResponse)
            await uploadService.handleTelcoConfirmation(telcoResponse)
          })
          res.status(201).json({status:true, data: process.id,  message:'FormData stored successfully' });
        }
        else if (!process.status && process.message=='falseCommit'){
          res.status(422).json({status:false, message: 'Request did not process correctly to completion' });
        }

        else if (!process.status && process.message=='badData'){
          res.status(400).json({status:false, message: 'Could not retrieve email or mobile phone number' });
        }
      }
      else{
        res.status(400).json({status:false, message: validation.error });
      }
      
    } catch (error) {
        logger.error('newUploadRequest: ' + error);
        res.status(400).json({ error: 'Internal Server Error' });
    }
  }),

  verifyAuthorizationCode :(async(req: Request, res: Response, next:any)=>{
    
    try{
      const authorizeData = req.body
      if (!authorizeData){
        res.status(400).json({ message: 'Bad request format' });
      }
      const uploadService = new UploadService()
      const post:any = await uploadService.authorizePost(req)
      if(post.isAuthorized){
        res.status(200).json({status:true, message:'Your instagram post request has been verified' });
      }
      else{
        res.status(403).json({status:false, message:'Your instagram post request failed authorization' });
      }

    }catch(err:any){
      console.log(err)
      res.status(400).json({ error: 'Internal Server Error' });
    }
  }),
}

export default uploadsControllers;