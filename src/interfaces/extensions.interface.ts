import { Request } from 'express';

interface Xrequest extends Request {
  userId?: string; // Add the userId property
  authToken?: string;
  user?:any;
  payload?:any;
  body:any;
}

export default Xrequest;
