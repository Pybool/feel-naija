import { RequestHandler } from "express";

export interface IAuth{
    register:RequestHandler;
    resendEmailConfirmation: RequestHandler;
    sendPasswordResetLink: RequestHandler;
    resetPassword: RequestHandler;
    verifyEmail: RequestHandler;
    login: RequestHandler;
    getRefreshToken: RequestHandler;
    getUserProfile: RequestHandler;
    saveUserProfile: RequestHandler;
  }
  