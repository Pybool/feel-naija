// src/index.ts
import express, {Request, Response} from 'express';
import http from 'http';
import cors from 'cors';
import WebSocket from 'ws';
import Websocket from './websockets';
import utils from './helpers/misc';
import session  from 'express-session';
import UploadRoute from './routes/uploadrequest.route';
import AuthRoute from './routes/authentication.route';
import AdminRoute from './routes/admin.route';
import FbAuthRoute from './routes/fbauthroute';
import './init.mongo'
import logger from './logger';
import config from './config';

import passport from "passport";
import strategy from "passport-facebook";
import { InstagramRequest } from './instagram/requestmanager';

const FacebookStrategy = strategy.Strategy;
const SERVER_URL = '0.0.0.0'
const app = express();

app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: 'SECRET'
}));

app.use(express.json());
app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use('/api/v1/auth',AuthRoute)
app.use('/api/v1/upload',UploadRoute)
app.use('/api/v1/admin',AdminRoute)
app.use('/',FbAuthRoute)

app.use(cors())

app.set('view engine', 'ejs');
app.set('views', 'src/templates');

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj:any, cb) {
  cb(null, obj);
});
passport.use(new FacebookStrategy({
    clientID: config.facebookAuth.clientID,
    clientSecret: config.facebookAuth.clientSecret,
    callbackURL: config.facebookAuth.callbackURL
  }, async function (accessToken, refreshToken, profile, done) {
    if(!accessToken) return null;
    InstagramRequest.saveLastLogin();
    const longLivedToken = await InstagramRequest.getLongLivedToken(accessToken)
    console.log("Long Lived Token ", longLivedToken)
    InstagramRequest.accessToken = accessToken
    // if(longLivedToken) InstagramRequest.accessToken = longLivedToken
    try{return done(null, profile);}
    catch{}
    return 
  }
));

const server = http.createServer(app);
let wss:any = utils.wss
wss = new WebSocket.Server({ server });
wss.on('connection', Websocket.connection);

const PORT = 8457;
server.listen(PORT, () => {
  logger.info(`Server is running on ${SERVER_URL}:${PORT}`);
});