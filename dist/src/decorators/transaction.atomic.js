"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.atomicTransaction = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
function atomicTransaction(callback) {
    return async (req, res, next) => {
        let session = null;
        try {
            session = await mongoose_1.default.startSession();
            await session.withTransaction(async () => {
                await callback(req, res, next);
            });
        }
        catch (error) {
            await session?.abortTransaction();
            console.error('Transaction error:', error);
            next(error);
        }
        finally {
            if (session) {
                session.endSession();
            }
        }
    };
}
exports.atomicTransaction = atomicTransaction;
