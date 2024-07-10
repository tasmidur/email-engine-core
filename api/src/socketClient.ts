import {Server} from "socket.io";

const io = new Server(3019, {
    cors: {
        origin: "*",
    }
});

export const publishMessage = (channel:string,message: any) => {
    console.log("Publishing message to channel", channel, message)
    io.emit(channel, JSON.stringify(message));
}