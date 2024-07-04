// src/services/UserService.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {User, UserCreate, UserUpdate} from '../models/User';
import {ElasticSearchService} from './ElasticSearchService';
import {USER_INDEX} from "../utils/Constant";
import {responseMessage} from "../utils/helpers";

const elasticSearchClient = new ElasticSearchService();

export class UserService {
    private indexName: string = USER_INDEX;

    async createUser(username: string, password: string): Promise<any> {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const user: UserCreate = {
                username,
                password: hashedPassword,
                createAt: new Date()
            };
            const userExist = await elasticSearchClient.searchDocuments(this.indexName, {
                term: {
                    username: user.username
                }
            });
            if (userExist.length) {
                return responseMessage(409, 'User already exist')
            }
            const userCreated = await elasticSearchClient.createDocument(this.indexName, user);
            return responseMessage(200, 'User created successfully', userCreated)
        } catch (error) {
            return responseMessage(500, 'Error creating user');
        }
    }


    async updateUser(userId: string, payload: UserUpdate): Promise<any> {
        return await elasticSearchClient.updateDocument(this.indexName, userId, payload);
    }


    generateJwt(payload: any): string {
        return jwt.sign(payload, String(process.env.JWT_SECRET), {expiresIn: '1h'});
    }
}
