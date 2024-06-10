"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authentication = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_errors_1 = __importDefault(require("http-errors"));
const messages_1 = __importDefault(require("../helpers/messages"));
const validations_core_1 = require("../helpers/validators/validations_core");
const jwt_helper_1 = __importDefault(require("../helpers/jwt_helper"));
const mailservice_1 = __importDefault(require("../services/mailservice"));
const joiAuthValidators_1 = __importDefault(require("../helpers/validators/joiAuthValidators"));
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class Authentication {
    constructor(req) {
        this.req = req;
        this.payload = req.body || {};
    }
    async register() {
        try {
            const session = await mongoose_1.default.startSession();
            const result = await joiAuthValidators_1.default.authSchema.validateAsync(this.req.body);
            const user = await user_model_1.default.findOne({ email: result.email }).session(session);
            if (user) {
                throw http_errors_1.default.Conflict(messages_1.default.auth.alreadyExistPartText);
            }
            let created = false;
            const userToCreate = new user_model_1.default(result);
            userToCreate.email_confirmed = true; //Remove this line
            const savedUser = await userToCreate.save();
            if (savedUser._id.toString().length > 0) {
                created = true;
                mailservice_1.default.auth.sendEmailConfirmationMail(savedUser, created);
                return { status: true, message: "Registration successful" };
            }
            return { status: false, message: "Registration was unsuccessfull!" };
        }
        catch (error) {
            let msg = "Registration was unsuccessfull!";
            if (error.message.includes('already exists!')) {
                error.status = 200;
                msg = error.message || "User with email address already exists!";
            }
            return { status: false, message: msg };
        }
    }
    async resendEmailConfirmation() {
        try {
            const result = await joiAuthValidators_1.default.authResendConfirmLinkSchema.validateAsync(this.req.body);
            const user = await user_model_1.default.findOne({ email: result.email });
            if (!user) {
                throw http_errors_1.default.NotFound(validations_core_1.utils.joinStringsWithSpace([
                    result.email,
                    messages_1.default.auth.notRegisteredPartText,
                ]));
            }
            if (user.email_confirmed) {
                return { status: false, message: messages_1.default.auth.emailAlreadyVerified };
            }
            return await mailservice_1.default.auth.sendEmailConfirmationMail(user, false);
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async sendPasswordResetLink() {
        try {
            const result = await joiAuthValidators_1.default.authSendResetPasswordLink.validateAsync(this.req.body);
            const user = await user_model_1.default.findOne({ email: result.email });
            if (!user) {
                throw http_errors_1.default.NotFound(validations_core_1.utils.joinStringsWithSpace([
                    result.email,
                    messages_1.default.auth.notRegisteredPartText,
                ]));
            }
            return await mailservice_1.default.auth.sendPasswordResetMail(result, user);
        }
        catch (error) {
            console.log(error);
            throw error.message;
        }
    }
    async resetPassword() {
        try {
            if (!this.req.query.token)
                throw http_errors_1.default.BadRequest(messages_1.default.auth.invalidTokenSupplied);
            const result = await joiAuthValidators_1.default.authResetPassword.validateAsync(this.req.body);
            const user = await user_model_1.default.findOne({
                reset_password_token: this.req.query.token,
                reset_password_expires: { $gt: Date.now() },
            });
            if (!user) {
                throw http_errors_1.default.NotFound(validations_core_1.utils.joinStringsWithSpace([
                    result.email,
                    messages_1.default.auth.userNotRequestPasswordReset,
                ]));
            }
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(result.password, salt);
            user.password = hashedPassword; // Set to the new password provided by the user
            user.reset_password_token = undefined;
            user.reset_password_expires = undefined;
            await user.save();
            return { status: true, message: messages_1.default.auth.passwordResetOk };
        }
        catch (error) {
            console.log(error);
            return { status: false, message: messages_1.default.auth.passwordResetFailed };
        }
    }
    async verifyEmail() {
        const { token } = this.req.query;
        if (!token) {
            return { status: false, message: messages_1.default.auth.missingConfToken };
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await user_model_1.default.findById(decoded.aud);
            user.email_confirmed = true;
            await user.save();
            return { status: true, message: messages_1.default.auth.emailVerifiedOk };
        }
        catch (error) {
            console.log(error);
            return { status: false, message: messages_1.default.auth.invalidConfToken };
        }
    }
    async login() {
        try {
            const result = await joiAuthValidators_1.default.authSchema.validateAsync(this.req.body);
            const user = await user_model_1.default.findOne({ email: result.email });
            if (!user)
                return http_errors_1.default.NotFound(messages_1.default.auth.userNotRegistered);
            const isMatch = await user.isValidPassword(result.password);
            if (!isMatch)
                return http_errors_1.default.Unauthorized(messages_1.default.auth.invalidCredentials);
            if (!user.email_confirmed)
                return http_errors_1.default.Unauthorized(messages_1.default.auth.emailNotVerified);
            const accessToken = await jwt_helper_1.default.signAccessToken(user.id);
            const refreshToken = await jwt_helper_1.default.signRefreshToken(user.id);
            return { status: true, data: user, accessToken, refreshToken };
        }
        catch (error) {
            console.log(error);
            return { status: false, message: messages_1.default.auth.loginError };
        }
    }
    async getRefreshToken(next) {
        try {
            const { refreshToken } = this.req.body;
            if (!refreshToken)
                throw http_errors_1.default.BadRequest();
            const { aud } = (await jwt_helper_1.default.verifyRefreshToken(refreshToken, next));
            if (aud) {
                const accessToken = await jwt_helper_1.default.signAccessToken(aud);
                // const refToken = await jwthelper.signRefreshToken(aud);
                return { status: true, accessToken: accessToken };
            }
        }
        catch (error) {
            console.log(error);
            return { status: false, message: error.mesage };
        }
    }
    async getUserProfile() {
        try {
            const user = await user_model_1.default.findOne({ _id: this.req.userId });
            if (!user) {
                throw http_errors_1.default.NotFound("User was not found");
            }
            return await user.getProfile();
        }
        catch (error) {
            console.log(error);
            throw error.message;
        }
    }
    async saveUserProfile() {
        try {
            const patchData = this.req.body;
            if (!patchData) {
                throw http_errors_1.default.NotFound("No data was provided");
            }
            const user = await user_model_1.default.findOne({ _id: this.req.userId });
            if (!user) {
                throw http_errors_1.default.NotFound("User was not found");
            }
            // Add fields validation
            Object.keys(patchData).forEach((field) => {
                if (field != "email")
                    user[field] = patchData[field];
            });
            await user.save();
            return { status: true, data: await user.getProfile(), message: "Profile updated successfully.." };
        }
        catch (error) {
            console.log(error);
            return { status: false, message: "Profile update failed.." };
        }
    }
    async toggleUserAdminStatus() {
        try {
            const userId = this.req.body.userId;
            const user = await user_model_1.default.findById(userId);
            user.isAdmin = !user.isAdmin;
            const savedUser = await user.save();
            return {
                status: savedUser.isAdmin,
                message: "Sucessfull",
                data: savedUser,
            };
        }
        catch (error) {
            console.log(error);
            return {
                status: false,
                message: error.message,
            };
        }
    }
}
exports.Authentication = Authentication;
