"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const ws_1 = __importDefault(require("ws"));
const websockets_1 = __importDefault(require("./websockets"));
const misc_1 = __importDefault(require("./helpers/misc"));
const express_session_1 = __importDefault(require("express-session"));
const uploadrequest_route_1 = __importDefault(require("./routes/uploadrequest.route"));
const authentication_route_1 = __importDefault(require("./routes/authentication.route"));
const admin_route_1 = __importDefault(require("./routes/admin.route"));
const fbauthroute_1 = __importDefault(require("./routes/fbauthroute"));
require("./init.mongo");
const logger_1 = __importDefault(require("./logger"));
const config_1 = __importDefault(require("./config"));
const passport_1 = __importDefault(require("passport"));
const passport_facebook_1 = __importDefault(require("passport-facebook"));
const requestmanager_1 = require("./instagram/requestmanager");
const FacebookStrategy = passport_facebook_1.default.Strategy;
const SERVER_URL = '0.0.0.0';
const app = (0, express_1.default)();
app.use((0, express_session_1.default)({
    resave: false,
    saveUninitialized: true,
    secret: 'SECRET'
}));
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static("public"));
app.use('/api/v1/auth', authentication_route_1.default);
app.use('/api/v1/upload', uploadrequest_route_1.default);
app.use('/api/v1/admin', admin_route_1.default);
app.use('/', fbauthroute_1.default);
app.use((0, cors_1.default)());
app.set('view engine', 'ejs');
app.set('views', 'src/templates');
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
passport_1.default.serializeUser(function (user, cb) {
    cb(null, user);
});
passport_1.default.deserializeUser(function (obj, cb) {
    cb(null, obj);
});
passport_1.default.use(new FacebookStrategy({
    clientID: config_1.default.facebookAuth.clientID,
    clientSecret: config_1.default.facebookAuth.clientSecret,
    callbackURL: config_1.default.facebookAuth.callbackURL
}, async function (accessToken, refreshToken, profile, done) {
    if (!accessToken)
        return null;
    requestmanager_1.InstagramRequest.saveLastLogin();
    const longLivedToken = await requestmanager_1.InstagramRequest.getLongLivedToken(accessToken);
    console.log("Long Lived Token ", longLivedToken);
    requestmanager_1.InstagramRequest.accessToken = accessToken;
    // if(longLivedToken) InstagramRequest.accessToken = longLivedToken
    try {
        return done(null, profile);
    }
    catch { }
    return;
}));
const server = http_1.default.createServer(app);
let wss = misc_1.default.wss;
wss = new ws_1.default.Server({ server });
wss.on('connection', websockets_1.default.connection);
const PORT = 8457;
server.listen(PORT, () => {
    logger_1.default.info(`Server is running on ${SERVER_URL}:${PORT}`);
});
