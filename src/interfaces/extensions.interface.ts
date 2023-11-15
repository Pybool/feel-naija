import { Request } from 'express';

interface Xrequest extends Request {
  userId?: string; // Add the userId property
  authToken?: string;
}

export default Xrequest;
