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
        expiresIn: '24h',
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
        expiresIn: '1y',
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
  verifyRefreshToken: (refreshToken:string) => {
    return new Promise((resolve, reject) => {
      JWT.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET as string,
        (err, payload:any) => {
          if (err) return reject(createError.Unauthorized())
          const userId = payload.aud
          // client.GET(userId, (err:any, result:string) => {
          //   if (err) {
          //     console.log(err.message)
          //     reject(createError.InternalServerError())
          //     return
          //   }
          //   if (refreshToken === result) return resolve(userId)
          //   reject(createError.Unauthorized())
          // })
        }
      )
    })
  },
}

export default jwthelper