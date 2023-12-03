import { NextFunction, Request, Response } from 'express';
import { IAdmin } from '../interfaces/admin.interface';
import { AdminService } from '../services/adminservice';
import Xrequest from '../interfaces/extensions.interface';
import { Authentication } from '../services/authservice';

const adminController:IAdmin  = {
  getIgPostRequests: async (req:Xrequest, res:Response) => {
    try {
        const adminService = new AdminService()
        return res.status(200).json(await adminService.getIgPostRequests(req)); 
    } catch (error) {
      return res.status(400).json({ status: false, error: error })
    }
  },

  pushIgPostRequest: async (req:Xrequest, res:Response) => {
    try {
        const adminService = new AdminService()
        const resp:any = await adminService.pushIgPostRequest(req)
        console.log("Upload Response ===> ", resp)
        if(resp==190){
          return res.redirect('/')
        }
        return res.status(200).json(resp); 
    } catch (error) {
      return res.status(400).json({ status: false, error: error })
    }
  },
  
  toggleUserAdminStatus: async (req: Xrequest, res: Response, next: NextFunction) => {
    try {
      let status = 400;
      const authentication = new Authentication(req);
      const result = await authentication.toggleUserAdminStatus();
      if (result) status = 200;
      res.status(status).json(result);

    } catch (error: any) {
      error.status = 422;
      next(error);
    }
  },
}

export default adminController