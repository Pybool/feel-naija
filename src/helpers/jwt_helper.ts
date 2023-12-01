import JWT from 'jsonwebtoken';
import createError from 'http-errors';
// import client from '../init.redis';
import { NextFunction, Response } from 'express';
import Xrequest from '../interfaces/extensions.interface';

const jwthelper = {
  signAccessToken: (userId:string,type='') => {
    return new Promise((resolve, reject) => {
      const payload = {}
      const secret = process.env.ACCESS_TOKEN_SECRET as string
      const options = {
        expiresIn: '600s',
        issuer: process.env.ISSUER,
        audience: userId
      }
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err.message)
          reject(createError.InternalServerError())
          return
        }
        resolve(token)
      })
    })
  },
  verifyAccessToken: (req:Xrequest, res:Response, next:NextFunction) => {
    if (!req.headers['authorization']) return next(createError.Unauthorized())
    const authHeader = req.headers['authorization']
    const bearerToken = authHeader.split(' ')
    const token = bearerToken[1]
    JWT.verify(token, process.env.ACCESS_TOKEN_SECRET as string, (err:any, payload:any) => {
      if (err) {
        const message =
          err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message
        return next(createError.Unauthorized(message))
      }
      req.payload = payload
      next()
    })
  },
  signRefreshToken: (userId:string) => {
    return new Promise((resolve, reject) => {
      const payload = {}
      const secret = process.env.REFRESH_TOKEN_SECRET as string
      const options = {
        expiresIn: '72h',
        issuer: process.env.ISSUER,
        audience: userId,
      }
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err.message)
          reject(createError.InternalServerError())
        }

        // client.SET(userId, token, 'EX', 365 * 24 * 60 * 60, (err:any, reply:any) => {
        //   if (err) {
        //     console.log(err.message)
        //     reject(createError.InternalServerError())
        //     return
        //   }
          resolve(token)
        // })
      })
    })
  },
  verifyRefreshToken: (refreshToken:string,next:any) => {
    return new Promise((resolve:any, reject:any) => {
      JWT.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET as string, (err:any, payload:any) => {
        if (err) {
          const message =
            err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message
          resolve({aud:false})
        }
        console.log("===========> ",payload)
        resolve(payload)
      })
    })
  },
}

export default jwthelper