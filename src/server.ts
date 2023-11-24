// src/index.ts
import express, {Request, Response} from 'express';
import http from 'http';
import cors from 'cors';
import WebSocket from 'ws';
import Websocket from './websockets';
import utils from './helpers/misc';

import UploadRoute from './routes/uploadrequest.route';
import AuthRoute from './routes/authentication.route';
import AdminRoute from './routes/admin.route';
import './init.mongo'
import logger from './logger';

const SERVER_URL = '0.0.0.0'
const app = express();
app.use(express.json());
app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use('/api/v1/auth',AuthRoute)
app.use('/api/v1/upload',UploadRoute)
app.use('/api/v1/admin',AdminRoute)


app.use(cors())

app.set('view engine', 'ejs');
app.set('views', 'src/templates');

const server = http.createServer(app);
let wss:any = utils.wss
wss = new WebSocket.Server({ server });
wss.on('connection', Websocket.connection);

app.get('/index', (request:Request, response:Response) => {
  response.send('Hello, WebSocket!');
});

const PORT = process.env.PORT || 8457;
server.listen(PORT, () => {
  logger.info(`Server is running on ${SERVER_URL}:${PORT}`);
});