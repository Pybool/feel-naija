"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = require("dotenv");
const logger_1 = __importDefault(require("./logger"));
(0, dotenv_1.config)();
// const uri = `mongodb+srv://ekoemmanueljavl:${process.env.MONGODB_PASSWORD}@cluster0.n8o8vva.mongodb.net/?retryWrites=true&w=majority`;
const mongouri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
console.log(process.env.DB_NAME);
mongoose_1.default
    .connect(mongouri, {
    dbName: process.env.DB_NAME || 'FEEL_NAIJA',
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
    logger_1.default.info('MongoDB connected Successfully.');
})
    .catch((err) => console.log(err.message));
mongoose_1.default.connection.on('connected', () => {
    logger_1.default.info('Mongoose connected to db');
});
mongoose_1.default.connection.on('error', (err) => {
    logger_1.default.info(err.message);
});
mongoose_1.default.connection.on('disconnected', () => {
    console.log('Mongoose connection is disconnected');
});
process.on('SIGINT', async () => {
    await mongoose_1.default.connection.close();
    process.exit(0);
});
