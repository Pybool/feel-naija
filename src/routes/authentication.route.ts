import express from 'express';
const router = express.Router();
import { handleInvalidMethod } from '../middlewares/invalidrequest'
import authController from '../controllers/authentication.controller';
import { decode, ensureAdmin } from '../middlewares/jwt';
import passport from 'passport';

router.post('/register', authController.register)
router.get('/verify-email-address', authController.verifyEmail)
router.post('/resend-email-verification', authController.resendEmailConfirmation)
router.post('/send-reset-password-link', authController.sendPasswordResetLink)
router.post('/reset-password', authController.resetPassword)
router.post('/login', authController.login)
router.post('/refresh-token', authController.getRefreshToken)
router.get('/user-profile', decode, authController.getUserProfile)
router.put('/user-profile', decode, authController.saveUserProfile)
router.get('/authorize', passport.authenticate("facebook"))




router.all('/register', handleInvalidMethod);
router.all('/verify-email-address', handleInvalidMethod);
router.all('/resend-email-verification', handleInvalidMethod);
router.all('/send-reset-password-link', handleInvalidMethod);
router.all('/reset-password', handleInvalidMethod);
router.all('/login', handleInvalidMethod);
router.all('/refresh-token', handleInvalidMethod);
router.all('/user-profile', handleInvalidMethod);
router.all('/user-profile', handleInvalidMethod);
export default router

