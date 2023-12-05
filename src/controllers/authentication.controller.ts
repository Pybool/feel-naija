import message from "../helpers/messages";
import createError from "http-errors";
import { NextFunction, Response } from "express";
import Xrequest from "../interfaces/extensions.interface";
import { IAuth } from "../interfaces/auth.interface";
import { Authentication } from "../services/authservice";

const authController: IAuth = {
  register: async (req: Xrequest, res: Response, next: NextFunction) => {
    try {
      let status = 400;
      const authentication = new Authentication(req);
      const result = await authentication.register();
      if (result.status) {
        status = 201;
        res.status(status).json(result);
      }
    } catch (error: any) {
      if (error.isJoi === true) {
        error.status = 422;
      }
      res
        .status(error?.status || 400)
        .json({ status: false, message: error?.message });
    }
  },

  sendPasswordResetLink: async (
    req: Xrequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let status = 400;
      const authentication = new Authentication(req);
      const result = await authentication.sendPasswordResetLink();
      if (result.status) status = 200;
      res.status(status).json(result);
    } catch (error: any) {
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  },

  resendEmailConfirmation: async (
    req: Xrequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let status = 200;
      const authentication = new Authentication(req);
      const result: any = await authentication.resendEmailConfirmation();
      if (!result.status) status = 400;
      res.status(status).json(result);
    } catch (error: any) {
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  },

  resetPassword: async (req: Xrequest, res: Response, next: NextFunction) => {
    console.log("reset password token ", req.query.token);
    try {
      let status = 400;
      const authentication = new Authentication(req);
      const result = await authentication.resetPassword();
      if (result.status) status = 200;
      res.status(status).json(result);
    } catch (error: any) {
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  },

  verifyEmail: async (req: Xrequest, res: Response, next: NextFunction) => {
    try {
      let status = 400;
      const authentication = new Authentication(req);
      const result = await authentication.verifyEmail();
      if (result.status) status = 200;
      res.status(status).json(result);
    } catch (error: any) {
      error.status = 422;
      next(error);
    }
  },

  login: async (req: Xrequest, res: Response, next: NextFunction) => {
    try {
      let status = 400;
      const authentication = new Authentication(req);
      const result = await authentication.login();
      if (result.status) {
        status = 200;
        res.status(status).json(result);
      } else {
        res
          .status(400)
          .json({ status: false, message: message.auth.invalidCredentials });
      }
    } catch (error: any) {
      if (error.isJoi === true)
        res
          .status(400)
          .json({ status: false, message: message.auth.invalidCredentials });
      res.status(400).json({ status: false, message: "Something went wrong" });
    }
  },

  getRefreshToken: async (req: Xrequest, res: Response, next: NextFunction) => {
    try {
      let status = 400;
      const authentication = new Authentication(req);
      if (req.body.refreshToken == "") {
        res.status(200).json({ status: false });
      }
      const result = await authentication.getRefreshToken(next);
      if (result) status = 200;
      res.status(status).json(result);
    } catch (error: any) {
      error.status = 422;
      next(error);
    }
  },

  getUserProfile: async (req: Xrequest, res: Response, next: NextFunction) => {
    try {
      let status = 400;
      const authentication = new Authentication(req);
      const result = await authentication.getUserProfile();
      if (result) status = 200;
      res.status(status).json(result);
    } catch (error: any) {
      error.status = 422;
      next(error);
    }
  },

  saveUserProfile: async (req: Xrequest, res: Response, next: NextFunction) => {
    try {
      let status = 400;
      const authentication = new Authentication(req);
      const result = await authentication.saveUserProfile();
      if (result) status = 200;
      res.status(status).json(result);
    } catch (error: any) {
      error.status = 422;
      next(error);
    }
  },
};

export default authController;
