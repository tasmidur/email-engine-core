import {MAIL_MESSAGE_INDEX} from "../utils/Constant";
import {responseMessage} from "../utils/helpers";
import {MessageSchema} from "../models/Message";
import {ElasticSearchClient} from "../ElasticSearchClient";
import {query} from "express";

const elasticSearchClient = new ElasticSearchClient();

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

    async deleteMessage(query:object): Promise<any> {
        try {
            const response = await elasticSearchClient.deleteDocument(
                this.indexName,
                {
                    ...query
                }
            );
            return responseMessage(
                200,
                "Message deleted successfully",
                response
            );
        } catch (error) {
            return responseMessage(500, "Error creating message");
        }
    }

    async syncMessages(messages: any[]): Promise<any> {
        let operations: any[] = [];
        for (let doc of messages) {
            let query = {
                query:{
                    match: {
                        messageId: doc.messageId,
                    }
                }
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
        // console.log("operations", JSON.stringify(operations, null, 2));
        return await elasticSearchClient.bulkUpsert(operations);
    }
}
