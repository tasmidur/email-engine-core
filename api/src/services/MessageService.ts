/**
 * Importing necessary constants and helpers
 */
import { MAIL_MESSAGE_INDEX } from "../utils/constant";
import { responseMessage } from "../utils/helpers";
import { ElasticSearchClient } from "../elasticSearchClient";
import { MessageSchema } from "../models/Message";

/**
 * Creating an instance of ElasticSearchClient
 */
const elasticSearchClient = new ElasticSearchClient();

/**
 * MessageService class provides methods to interact with message documents in ElasticSearch.
 */
export class MessageService {
    /**
     * Index name for message documents.
     */
    private indexName: string = MAIL_MESSAGE_INDEX;

    constructor(){
        elasticSearchClient.initElasticsearch([
            MessageSchema
        ]).then((res: any) => console.log("Elasticsearch MessageSchema initialized")).catch((err: any) => console.log(err));
    }

    /**
     * Retrieves messages for a given user ID with pagination.
     *
     * @param {any} filter - Filter object containing the user ID, size, and from parameters.
     * @returns {Promise<any>} A promise that resolves with the message documents.
     */
    async getMessages(filter: any): Promise<any> {
        try {
            /**
             * Searching for messages in the message index with pagination
             */
            const messages = await elasticSearchClient.getDocumentWithPagination(this.indexName, {
                match: {
                    userId: filter.userId,
                }
            }, filter.size, filter.from);

            return responseMessage(200, "Messages", messages);
        } catch (error: any) {
            console.log(`Error getting messages:`,error);
            throw new Error(`Error getting messages:`);
        }
    }

    /**
     * Deletes a message document by query.
     *
     * @param {object} query - Query object to match the message document to delete.
     * @returns {Promise<any>} A promise that resolves with the deletion response.
     */
    async deleteMessage(query: object): Promise<any> {
        try {
            /**
             * Deleting a message document
             */
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
            console.log(`Error deleting message:`,error);
            throw new Error(`Error deleting message`);
        }
    }

    /**
     * Bulk upsert message documents.
     *
     * @param {any[]} messages - Array of message documents to upsert.
     * @returns {Promise<any>} A promise that resolves with the bulk upsert response.
     */
    async bulkUpsertMessages(messages: any[]): Promise<any> {
        try {
            /**
             * Preparing bulk upsert operations
             */
            let operations: any[] = [];
            for (let doc of messages) {
                let query = {
                    query: {
                        match: {
                            messageId: doc.messageId,
                        }
                    }
                };
                let existingDoc = await elasticSearchClient.searchDocuments(
                    this.indexName,
                    query
                );
                let existingDocId = (existingDoc[0] as any)?._id?? null;

                if (existingDocId) {
                    operations.push(
                        { update: { _index: this.indexName, _id: existingDocId } },
                        { doc: doc }
                    );
                } else {
                    operations.push({ index: { _index: this.indexName } }, doc);
                }
            }

            /**
             * Executing bulk upsert operation
             */
            return await elasticSearchClient.bulkUpsert(operations);
        } catch (error: any) {
            console.log(`Error syncing messages:`,error);
            throw new Error(`Error syncing messages`);
        }
    }
}