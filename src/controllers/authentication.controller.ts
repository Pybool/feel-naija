import createError from 'http-errors';
import User from '../models/user.model';
import JWT from 'jsonwebtoken';
import message from '../helpers/messages';
import utils from '../helpers/utilsfn';
import mailActions from '../helpers/mail_actions';
import validations from '../helpers/validation_schema';
import jwthelper from '../helpers/jwt_helper';
import client from '../helpers/init_redis';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { WebSocket } from 'ws';

const session = await mongoose.startSession();

const authRoutes =  {
  register: async (req, res, next) => {
  
    try {
      const result = await validations.authSchema.validateAsync(req.body);
      const user = await User.findOne({ email: result.email }).session(session);
      if (user) {
        throw createError.Conflict(utils.joinStringsWithSpace([result.email, message.auth.alreadyExistPartText]));
      }
      let created = false;
      const userToCreate = new User(result)
      userToCreate.email_confirmed = true; //Only for development
      const savedUser = await userToCreate.save()
      created = true;

      await mailActions.auth.sendEmailConfirmationMail(savedUser, created);
      res.send({ success: true, message: 'Registration successful' });
    } catch (error) {
      if (error.isJoi === true) {
        error.status = 422;
      }
      next(error);
    }
  },
  
  resendEmailConfirmation:async (req, res, next) => {
    try {
      const result = await validations.authResendConfirmLinkSchema.validateAsync(req.body)
      const user = await User.findOne({ email: result.email })
      if (!user){
        throw createError.NotFound(utils.joinStringsWithSpace([result.email,message.auth.notRegisteredPartText]))
      }
      
      if(user.email_confirmed){
        res.send({status:false,message: message.auth.emailAlreadyVerified})
      }
      else{
        res.send(await mailActions.auth.sendEmailConfirmationMail(user,false)) 
      }
        
    } catch (error) {
      if (error.isJoi === true) error.status = 422
      next(error)
    }
  },

  sendPasswordResetLink:async (req, res, next) => {
    try {
      const result = await validations.authSendResetPasswordLink.validateAsync(req.body)
      const user = await User.findOne({ email: result.email })
      if (!user){
        throw createError.NotFound(utils.joinStringsWithSpace([result.email,message.auth.notRegisteredPartText]))
      }
      res.send(await mailActions.auth.sendPasswordResetMail(result,user)) 
    } catch (error) {
      if (error.isJoi === true) error.status = 422
      next(error)
    }
  },

  resetPassword:async (req, res, next) => {
    console.log("reset password token ", req.query.token)
    try{
      if(!req.query.token)
          throw createError.BadRequest(message.auth.invalidTokenSupplied)
      const result = await validations.authResetPassword.validateAsync(req.body)
      const user = await User.findOne({
        reset_password_token: req.query.token,
        reset_password_expires: { $gt: Date.now() },
      });
      if (!user){
        throw createError.NotFound(utils.joinStringsWithSpace([result.email,message.auth.userNotRequestPasswordReset]))
      }
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(result.password, salt)
      user.password = hashedPassword; // Set to the new password provided by the user
      user.reset_password_token = undefined;
      user.reset_password_expires = undefined;
      await user.save();
      res.send({status:true,message:message.auth.passwordResetOk})

    }catch (error) {
      if (error.isJoi === true) error.status = 422
      next(error)
    }
  },

  confirm:async (req, res, next) => {
    const { token } = req.query;  
    if (!token) {
      return res.status(400)on({status:false, message: message.auth.missingConfToken });
    }
    try {
      const decoded = JWT.verify(token, process.env.ACCESS_TOKEN_SECRET); 
      const user = await User.findById(decoded.aud);
      user.email_confirmed = true;
      await user.save();
  
      reson({status:true, message: message.auth.emailVerifiedOk });
    } catch (error) {
      return res.status(401)on({ message: message.auth.invalidConfToken });
    }
  },  

  login: async (req, res, next) => {

    try {
      const result = await validations.authSchema.validateAsync(req.body)
      const user = await User.findOne({ email: result.email })
      if (!user) throw createError.NotFound(message.auth.userNotRegistered)

      const isMatch = await user.isValidPassword(result.password)
      if (!isMatch)
        throw createError.Unauthorized(message.auth.invalidCredentials)

      if(!user.email_confirmed)
        throw createError.Unauthorized(message.auth.emailNotVerified)

      const accessToken = await jwthelper.signAccessToken(user.id)
      const refreshToken = await jwthelper.signRefreshToken(user.id)
      const preferredCurrency = user.preferredCurrency

      res.send({status:true, accessToken, refreshToken ,preferredCurrency})
    } catch (error) {
      if (error.isJoi === true)
        return next(createError.BadRequest(message.auth.invalidCredentials))
      next(error)
    }
  },

  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body
      if (!refreshToken) throw createError.BadRequest()
      const userId = await jwthelper.verifyRefreshToken(refreshToken)
      const accessToken = await jwthelper.signAccessToken(userId)
      const refToken = await jwthelper.signRefreshToken(userId)
      res.send({ accessToken: accessToken, refreshToken: refToken })
    } catch (error) {
      next(error)
    }
  },

  logout: async (req, res, next) => {
    try {
      const { refreshToken } = req.body
      if (!refreshToken) throw createError.BadRequest()
      const userId = await jwthelper.verifyRefreshToken(refreshToken)
      client.DEL(userId, (err, val) => {
        if (err) {
          console.log(err.message)
          throw createError.InternalServerError()
        }
        res.sendStatus(204)
      })
    } catch (error) {
      next(error)
    }
  },

  getProfile: async (req, res, next) => {
    try {
      
      const user = await User.findOne({_id: req.userId});
      if (!user){
        throw createError.NotFound('User was not found')
      }
      res.send(await user.getProfile())
      
    } catch (error) {
      next(error)
    }
  },

  saveProfile: async (req, res, next) => {
    try {
      const patchData = req.body
      if (!patchData){
        throw createError.NotFound('No data was provided')
      }
      const user = await User.findOne({_id: req.userId});
      if (!user){
        throw createError.NotFound('User was not found')
      }
      // Add fields validation
      Object.keys(patchData).forEach((field)=>{
        if(field != 'email')
          user[field] = patchData[field]
      })
      await user.save()
      res.send({status:true,message:"Profile updated successfully.."})
      
    } catch (error) {
      next(error)
    }
  },
}

export default authRoutes
