import * as dotenv from 'dotenv';
dotenv.config();
import CryptoJS from "crypto-js"

const ENCRYPTION_KEY = String(process.env.ENCRYPTION_KEY); 

export function encrypt(text:string) {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(text:string) {
    let bytes  = CryptoJS.AES.decrypt(text, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}
