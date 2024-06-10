"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ejs_1 = __importDefault(require("ejs"));
const mailtrigger_1 = __importDefault(require("./mailtrigger"));
const jwt_helper_1 = __importDefault(require("../helpers/jwt_helper"));
const mailActions = {
    auth: {
        sendEmailConfirmationMail: async (savedUser, created) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const usermail = savedUser.email;
                    const accessToken = await jwt_helper_1.default.signAccessToken(savedUser.id);
                    const refreshToken = await jwt_helper_1.default.signRefreshToken(savedUser.id);
                    const confirmationLink = `${process.env.BACKEND_BASE_URL}/auth/confirm?token=${accessToken}`;
                    const template = await ejs_1.default.renderFile("src/templates/emailConfirmation.ejs", { usermail, confirmationLink });
                    const mailOptions = {
                        from: "info.feelnigeria@gmail.com",
                        to: savedUser?.email,
                        subject: "Confirm your registration",
                        text: `Click the following link to confirm your registration: ${confirmationLink}`,
                        html: template,
                    };
                    await (0, mailtrigger_1.default)(mailOptions);
                    if (created)
                        resolve({ status: true, accessToken, refreshToken });
                    else
                        resolve({ status: true, link: confirmationLink });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false, link: "" });
                }
            }).catch((error) => {
                console.log(error);
                throw error;
            });
        },
        sendPasswordResetMail: async (email, user) => {
            return { status: true, message: "" };
        },
    },
    uploadRequest: {
        sendOneTimePasswordMail: async (payload) => {
            let authorizationTemplate;
            let mailOptions;
            try {
                authorizationTemplate = await ejs_1.default.renderFile("src/templates/approvalOtpTemplate.ejs", {
                    authorizationCode: payload.authorizationCode,
                    recepient: payload.email,
                    postRef: payload.postRef,
                });
                console.log("Mail payload ", payload, authorizationTemplate)
                mailOptions = {
                    from: "info.feelnigeria@gmail.com",
                    to: payload?.email,
                    subject: "Sms Confirmed",
                    text: `Your sms was confirmed`,
                    html: authorizationTemplate,
                };
            }
            catch (error) {
                console.log(error);
                throw error;
            }
            try {
                await (0, mailtrigger_1.default)(mailOptions);
            }
            catch (err) {
                console.log(err);
            }
        },
    },
};
exports.default = mailActions;
