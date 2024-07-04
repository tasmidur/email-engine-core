export interface Message {
    messageId: string;
    userId: string;
    subject: string;
    bodyPreview: string;
    parentFolderId: string;
    conversationId: string;
    body: object;
    isRead: boolean;
    isDraft: boolean;
    messageType: "new" | "reply" | "forward";
    sender: object;
    receiver: object;
    createAt?: Date;
    updateAt?: Date;
}