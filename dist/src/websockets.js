"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const misc_1 = __importDefault(require("./helpers/misc"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
let ref;
const joinedRooms = new Set();
class Websocket {
    constructor() {
        misc_1.default.userConnections = new Map();
        ref = this;
    }
    connection(wss, req) {
        const authToken = req.url.split('authToken=')[1];
        const decoded = ref.authenticateWS(authToken);
        if (decoded) {
            // Handle the authToken as needed
            console.log('Received WebSocket connection with authToken:', authToken);
            wss.on('message', (message) => {
                const parsedMessage = JSON.parse(message);
                console.log(`Parsed Received: ${parsedMessage}`);
                if (parsedMessage.type === "PRIVATE_CHANNEL") {
                    const channelType = parsedMessage.channelType;
                    const userChannel = [channelType, decoded.aud].join("-");
                    if (!misc_1.default.userConnections.has(userChannel)) {
                        misc_1.default.userConnections.set(userChannel, wss);
                        joinedRooms.add(wss);
                        console.log(90000);
                        wss.send(JSON.stringify({
                            type: "PRIVATE_CHANNELS",
                            data: `Successfully joined private ${channelType} wsocket Channel`,
                        }));
                    }
                }
            });
            wss.on("close", () => {
                console.log("WebSocket client disconnected");
                // joinedRooms.forEach((roomName) => {
                //   const room = global.rooms.get(roomName);
                //   if (room) {
                //     room.delete(wsocket);
                //     if (room.size === 0) {
                //       global.rooms.delete(roomName);
                //     }
                //   }
                // });
                // global.userConnections.delete()
            });
        }
    }
    authenticateWS(authToken) {
        try {
            console.log("secret ", process.env.ACCESS_TOKEN_SECRET);
            const decoded = jsonwebtoken_1.default.verify(authToken, process.env.ACCESS_TOKEN_SECRET || '');
            return decoded;
        }
        catch (error) {
            return { aud: '000000000000000' }; //Remove after implementing Authentication
        }
    }
}
exports.default = new Websocket();
