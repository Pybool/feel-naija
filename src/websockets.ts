
class Websocket{

    constructor(){}
    public connection (ws:any)  {
        ws.on('message', (message:string) => {
            console.log(`Received: ${message}`);
            ws.send(`Server received: ${message}`);
        });
    }
       
}

export default new Websocket()