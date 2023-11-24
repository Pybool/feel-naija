import utils from './helpers/misc';
import jwt from "jsonwebtoken";
let ref:any;
const joinedRooms = new Set();

class Websocket{
    constructor(){
        utils.userConnections = new Map();
        ref = this
    }

    public connection (wss:any, req:any)  {
        const authToken = req.url.split('authToken=')[1];
        const decoded:any = ref.authenticateWS(authToken)
        if(decoded){
        // Handle the authToken as needed
        console.log('Received WebSocket connection with authToken:', authToken);
        wss.on('message', (message:string) => {
            const parsedMessage = JSON.parse(message)
            console.log(`Parsed Received: ${parsedMessage}`);
            if (parsedMessage.type === "PRIVATE_CHANNEL") {
                const channelType = parsedMessage.channelType;                
                    const userChannel = [channelType, decoded.aud].join("-");
                    if (!utils.userConnections.has(userChannel)) {
                        utils.userConnections.set(userChannel, wss);
                        joinedRooms.add(wss)
                        console.log(90000)
                        wss.send(
                            JSON.stringify({
                            type: "PRIVATE_CHANNELS",
                            data: `Successfully joined private ${channelType} wsocket Channel`,
                            })
                        );
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

    private authenticateWS(authToken:string){
        try {
            console.log("secret ", process.env.ACCESS_TOKEN_SECRET)
            const decoded = jwt.verify(
              authToken,
              process.env.ACCESS_TOKEN_SECRET || ''
            );
            return decoded
          } 
        catch (error) {
            return {aud:'000000000000000'}; //Remove after implementing Authentication
        }
    }
       
}

export default new Websocket()