"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const messages_1 = __importDefault(require("../helpers/messages"));
const authservice_1 = require("../services/authservice");
const authController = {
    register: async (req, res, next) => {
        let status = 200;
        try {
            const authentication = new authservice_1.Authentication(req);
            const result = await authentication.register();
            if (result.status) {
                status = 201;
                res.status(status).json(result);
            }
            else {
                console.log("result ", result);
                return res.status(200).json(result);
            }
        }
        catch (error) {
            console.log("Auth error ", error.message);
            if (error.isJoi === true) {
                error.status = 422;
            }
            res
                .status(status)
                .json({ status: false, message: error?.message });
        }
    },
    sendPasswordResetLink: async (req, res, next) => {
        try {
            let status = 400;
            const authentication = new authservice_1.Authentication(req);
            const result = await authentication.sendPasswordResetLink();
            if (result.status)
                status = 200;
            res.status(status).json(result);
        }
        catch (error) {
            if (error.isJoi === true)
                error.status = 422;
            next(error);
        }
    },
    resendEmailConfirmation: async (req, res, next) => {
        try {
            let status = 200;
            const authentication = new authservice_1.Authentication(req);
            const result = await authentication.resendEmailConfirmation();
            if (!result.status)
                status = 400;
            res.status(status).json(result);
        }
        catch (error) {
            if (error.isJoi === true)
                error.status = 422;
            next(error);
        }
    },
    resetPassword: async (req, res, next) => {
        console.log("reset password token ", req.query.token);
        try {
            let status = 400;
            const authentication = new authservice_1.Authentication(req);
            const result = await authentication.resetPassword();
            if (result.status)
                status = 200;
            res.status(status).json(result);
        }
        catch (error) {
            if (error.isJoi === true)
                error.status = 422;
            next(error);
        }
    },
    verifyEmail: async (req, res, next) => {
        try {
            let status = 400;
            const authentication = new authservice_1.Authentication(req);
            const result = await authentication.verifyEmail();
            if (result.status)
                status = 200;
            res.status(status).json(result);
        }
        catch (error) {
            error.status = 422;
            next(error);
        }
    },
    login: async (req, res, next) => {
        try {
            let status = 400;
            const authentication = new authservice_1.Authentication(req);
            const result = await authentication.login();
            if (result.status) {
                status = 200;
                res.status(status).json(result);
            }
            else {
                res
                    .status(400)
                    .json({ status: false, message: messages_1.default.auth.invalidCredentials });
            }
        }
        catch (error) {
            if (error.isJoi === true) {
                res
                    .status(400)
                    .json({ status: false, message: messages_1.default.auth.invalidCredentials });
            }
            else {
                res.status(400).json({ status: false, message: "Could not process login request!" });
            }
        }
    },
    getRefreshToken: async (req, res, next) => {
        try {
            let status = 400;
            const authentication = new authservice_1.Authentication(req);
            if (req.body.refreshToken == "") {
                res.status(200).json({ status: false });
            }
            const result = await authentication.getRefreshToken(next);
            if (result)
                status = 200;
            res.status(status).json(result);
        }
        catch (error) {
            error.status = 422;
            next(error);
        }
    },
    getUserProfile: async (req, res, next) => {
        try {
            let status = 400;
            const authentication = new authservice_1.Authentication(req);
            const result = await authentication.getUserProfile();
            if (result)
                status = 200;
            res.status(status).json(result);
        }
        catch (error) {
            error.status = 422;
            next(error);
        }
    },
    saveUserProfile: async (req, res, next) => {
        try {
            let status = 400;
            const authentication = new authservice_1.Authentication(req);
            const result = await authentication.saveUserProfile();
            if (result)
                status = 200;
            res.status(status).json(result);
        }
        catch (error) {
            error.status = 422;
            next(error);
        }
    },
};
exports.default = authController;
