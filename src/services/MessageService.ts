import {ElasticSearchService} from "./ElasticSearchService";
import {MAIL_MESSAGE_INDEX} from "../utils/Constant";
import {responseMessage} from "../utils/helpers";
import {MessageSchema} from "../models/Message";
import {log} from "console";

const elasticSearchClient = new ElasticSearchService();

export class MessageService {
    private indexName: string = MAIL_MESSAGE_INDEX;

    constructor() {
        elasticSearchClient
            .createIndex(this.indexName, MessageSchema)
            .then((res) => {

            });
    }

    async getMessages(filter: any): Promise<any> {
        try {
            const messages = await elasticSearchClient.getDocumentWithPagination(this.indexName, {
                    match: {
                        userId: filter.userId,
                    }
                },
                filter.size,
                filter.from
            );
            return responseMessage(200, "Messages", messages);
        } catch (error) {
            return responseMessage(500, "Error getting messages");
        }
    }

    async createMessage(message: any): Promise<any> {
        try {
            const createMessage = await elasticSearchClient.createDocument(
                this.indexName,
                message
            );
            return responseMessage(
                200,
                "Message created successfully",
                createMessage
            );
        } catch (error) {
            return responseMessage(500, "Error creating message");
        }
    }

    async syncMessages(messages: any[]): Promise<void> {
        let operations: any[] = [];
        for (let doc of messages) {
            let query = {
                match: {
                    messageId: doc.messageId,
                },
            };
            let existingDoc = await elasticSearchClient.searchDocuments(
                this.indexName,
                query
            );
            let existingDocId = existingDoc[0]?._id ?? null;

            if (existingDocId) {
                operations.push(
                    {update: {_index: this.indexName, _id: existingDocId}},
                    {doc: doc}
                );
            } else {
                operations.push({index: {_index: this.indexName}}, doc);
            }
        }
        await elasticSearchClient.bulkUpsert(operations);
        console.log("sync message......");
    }
}
