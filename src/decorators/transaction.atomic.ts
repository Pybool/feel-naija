import { RequestHandler, Response } from 'express';
import mongoose from 'mongoose';

function atomicTransaction(callback: RequestHandler): RequestHandler {
  return async (req, res, next) => {
    let session = null;

    try {
      session = await mongoose.startSession();
      await session.withTransaction(async () => {
        await callback(req, res, next);
      });

    } catch (error) {
        await session?.abortTransaction();
      console.error('Transaction error:', error);
      next(error);
    } finally {
      if (session) {
        session.endSession();
      }
    }
  };
}

export { atomicTransaction };
