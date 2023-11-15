// src/index.ts
import express, {Request, Response} from 'express';
import http from 'http';
import WebSocket from 'ws';
import Websocket from './websockets';
import UploadRoute from './routes/uploadrequest.route';
import './init.mongo'
import logger from './logger';
const SERVER_URL = 'https://q5lf7fwc-8457.uks1.devtunnels.ms/'

const app = express();
app.use('/api/v1',UploadRoute)
app.use(express.json());

const server = http.createServer(app);
const wss:any = new WebSocket.Server({ server });
wss.on('connection', Websocket.connection);

app.get('/index', (request:Request, response:Response) => {
  response.send('Hello, WebSocket!');
});

const PORT = process.env.PORT || 8457;
server.listen(PORT, () => {
  logger.info(`Server is running on ${SERVER_URL}`);
});