"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const invalidrequest_1 = require("../middlewares/invalidrequest");
const authentication_controller_1 = __importDefault(require("../controllers/authentication.controller"));
const jwt_1 = require("../middlewares/jwt");
const passport_1 = __importDefault(require("passport"));
router.post('/register', authentication_controller_1.default.register);
router.get('/verify-email-address', authentication_controller_1.default.verifyEmail);
router.post('/resend-email-verification', authentication_controller_1.default.resendEmailConfirmation);
router.post('/send-reset-password-link', authentication_controller_1.default.sendPasswordResetLink);
router.post('/reset-password', authentication_controller_1.default.resetPassword);
router.post('/login', authentication_controller_1.default.login);
router.post('/refresh-token', authentication_controller_1.default.getRefreshToken);
router.get('/user-profile', jwt_1.decode, authentication_controller_1.default.getUserProfile);
router.put('/user-profile', jwt_1.decode, authentication_controller_1.default.saveUserProfile);
router.get('/authorize', passport_1.default.authenticate("facebook"));
router.all('/register', invalidrequest_1.handleInvalidMethod);
router.all('/verify-email-address', invalidrequest_1.handleInvalidMethod);
router.all('/resend-email-verification', invalidrequest_1.handleInvalidMethod);
router.all('/send-reset-password-link', invalidrequest_1.handleInvalidMethod);
router.all('/reset-password', invalidrequest_1.handleInvalidMethod);
router.all('/login', invalidrequest_1.handleInvalidMethod);
router.all('/refresh-token', invalidrequest_1.handleInvalidMethod);
router.all('/user-profile', invalidrequest_1.handleInvalidMethod);
router.all('/user-profile', invalidrequest_1.handleInvalidMethod);
exports.default = router;