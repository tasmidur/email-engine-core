// src/services/UserService.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserCreate, UserUpdate } from '../models/User';
import { ElasticSearchService } from './ElasticSearchService';

const elasticSearchClient = new ElasticSearchService();

export class UserService {
    private indexName:string="user_index";

    async createUser(username: string, password: string): Promise<any> {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user: UserCreate = {
            username,
            password: hashedPassword
        };
        return await elasticSearchClient.createDocument(this.indexName, user);
    }

    async updateUser(userId: string, payload: UserUpdate): Promise<any> {
        return await elasticSearchClient.updateDocument(this.indexName,userId,payload);
    }


    generateJwt(user: User): string {
        return jwt.sign({username: user.username }, String(process.env.JWT_SECRET), { expiresIn: '1h' });
    }
}
