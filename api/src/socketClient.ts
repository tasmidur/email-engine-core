import {Server} from "socket.io";
import * as dotenv from 'dotenv'; // Import dotenv module
dotenv.config();

const io = new Server(Number(process.env.SOCKET_PORT), {
    cors: {
        origin: "*",
    }
});

export const publishMessage = (channel:string,message: any) => {
    io.emit(channel, JSON.stringify(message));
}