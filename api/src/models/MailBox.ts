import { MAILBOX_INDEX } from "../utils/Constant";

export interface MailBox {
  userId: string;
  emailAddress: string;
  displayName: string;
  totalMessages?: number;
  unreadMessages?: number;
  createAt?: Date;
  updateAt?: Date;
}

export const MailBoxSchema = {
  index: MAILBOX_INDEX,
  body: {
    mappings: {
      properties: {
        userId: { type: "keyword" },
        emailAddress: { type: "keyword" },
        displayName: { type: "text" },
        totalMessages: { type: "integer" },
        unreadMessages: { type: "integer" },
        createAt: { type: "date" },
        updateAt: { type: "date" },
      },
    },
  },
};
