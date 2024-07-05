import { USER_INDEX } from "../utils/Constant";

export interface User {
  username: string;
  password: string;
  providerType: "outlook" | "gmail" | "yahoo" | "hotmail" | "other";
  emailAddress: string;
  displayName: string;
  identityKey: string; // mail id
  accessToken: string;
  refreshToken: string;
  expireIn: Date;
  createAt: Date;
  updateAt: Date;
}

export interface UserCreate extends Partial<User> {
  username: string;
  password: string;
  createAt: Date;
}

export interface UserUpdate extends Partial<User> {
  providerType: "outlook" | "gmail" | "yahoo" | "hotmail" | "other";
  emailAddress?: string;
  displayName?: string;
  identityKey?: string; // mail id
  accessToken?: string;
  refreshToken?: string;
  expireIn?: Date;
  updateAt: Date;
}

export const UserSchema = {
  index: USER_INDEX,
  body: {
    mappings: {
      properties: {
        username: { type: "keyword" },
        password: { type: "text" },
        providerType: { type: "keyword" },
        emailAddress: { type: "keyword" },
        displayName: { type: "text" },
        identityKey: { type: "keyword" },
        accessToken: { type: "text" },
        refreshToken: { type: "text" },
        expireIn: { type: "date" },
        createAt: { type: "date" },
        updateAt: { type: "date" },
      },
    },
  },
};
