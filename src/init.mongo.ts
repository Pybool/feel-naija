import mongoose from 'mongoose';
import { config as dotenvConfig } from 'dotenv';
import logger from './logger';
dotenvConfig()
// const uri = `mongodb+srv://ekoemmanueljavl:${process.env.MONGODB_PASSWORD}@cluster0.n8o8vva.mongodb.net/?retryWrites=true&w=majority`;

const mongouri:any = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
mongoose 
  .connect(mongouri, {
    dbName: process.env.DB_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as mongoose.ConnectOptions)
  .then(() => {
    logger.info('MongoDB connected Successfully.')
  })
  .catch((err) => console.log(err.message))

mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to db')
})

mongoose.connection.on('error', (err) => {
  logger.info(err.message)
})

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose connection is disconnected')
})

process.on('SIGINT', async () => {
  await mongoose.connection.close()
  process.exit(0)
})
