// src/services/UserService.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserCreate, UserSchema, UserUpdate } from "../models/User";
import { ElasticSearchService } from "./ElasticSearchService";
import { USER_INDEX } from "../utils/Constant";
import { responseMessage } from "../utils/helpers";
import cron from "node-cron";

const elasticSearchClient = new ElasticSearchService();

export class UserService {
  private indexName: string = USER_INDEX;

  constructor() {
    elasticSearchClient
      .createIndex(this.indexName, UserSchema)
      .then((res) => {});
  }

  async createUser(username: string, password: string): Promise<any> {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user: UserCreate = {
        username,
        password: hashedPassword,
        createAt: new Date(),
      };
      const userExist = await elasticSearchClient.searchDocuments(
        this.indexName,
        {
          match: {
            username: user.username,
          },
        }
      );
      if (userExist.length) {
        return responseMessage(409, "User already exist");
      }
      const userCreated = await elasticSearchClient.createDocument(
        this.indexName,
        user
      );
      return responseMessage(200, "User created successfully", userCreated);
    } catch (error) {
      return responseMessage(500, "Error creating user");
    }
  }

  async getUserById(id: string): Promise<any> {
    const userDetail = await elasticSearchClient.getDocument(
      this.indexName,
      id
    );
    console.log("getUserById",responseMessage(200, "User Details", userDetail));
    
    return responseMessage(200, "User Details", userDetail);
  }

  async updateUser(userId: string, payload: UserUpdate): Promise<any> {
    try {
      const userResponse=await elasticSearchClient.updateDocument(
        this.indexName,
        userId,
        payload
      );
      return responseMessage(200, "User update successfully", userResponse);
    } catch (error:any) {
      const{status,message,data}=error.response;
      return responseMessage(status, message, data);
    }
  }

  generateJwt(payload: any): string {
    return jwt.sign(payload, String(process.env.JWT_SECRET), {
      expiresIn: "1h",
    });
  }

  async scheduleUserCronJob(
    userId: string,
    cronExpression: string,
    task: () => Promise<void>
  ) {
    cron.schedule(cronExpression, async () => {
      console.log(`Running cron job for user: ${userId}`);
      await task();
    });
    console.log(
      `Cron job scheduled for user: ${userId} with expression: ${cronExpression}`
    );
  }

  isAccessTokenExpire(tokenExpires: string): boolean {
    const expirationDate = new Date(tokenExpires);
    const now = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes in milliseconds
    return true;//now >= expirationDate;
  }
}
