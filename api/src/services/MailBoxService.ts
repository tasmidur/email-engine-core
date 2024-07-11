/**
 * Importing necessary constants and helpers
 */
import { MAIL_MESSAGE_INDEX, MAILBOX_INDEX } from "../utils/constant";
import { responseMessage } from "../utils/helpers";
import { ElasticSearchClient } from "../elasticSearchClient";

/**
 * Creating an instance of ElasticSearchClient
 */
const elasticSearchClient = new ElasticSearchClient();

/**
 * MailBoxService class provides methods to update and retrieve mailbox details.
 */
export class MailBoxService {
    /**
     * Index name for mailbox documents.
     */
    private indexName: string = MAILBOX_INDEX;

    /**
     * Updates mailbox details for a given user ID.
     *
     * @param {any} filter - Filter object containing the user ID.
     * @returns {Promise<any>} A promise that resolves with the updated mailbox details.
     */
    async updateMailBoxDetails(filter: any): Promise<any> {
        try {
            /**
             * Searching for messages in the mail message index
             */
            const response = await elasticSearchClient.getEsInstance().search({
                index: MAIL_MESSAGE_INDEX,
                body: {
                    size: 0,
                    query: {
                        match: {
                            userId: filter.userId,
                        }
                    },
                    aggs: {
                        total_messages: {
                            value_count: {
                                field: "_id"
                            }
                        },
                        read_messages: {
                            filter: {
                                term: {
                                    isRead: true
                                }
                            }
                        },
                        draft_messages: {
                            filter: {
                                term: {
                                    isDraft: true
                                }
                            }
                        }
                    }
                }
            });

            /**
             * Extracting aggregation results
             */
            const { aggregations: { draft_messages, read_messages, total_messages } } = response.body;

            /**
             * Preparing update data
             */
            const updateData = {
                userId: filter.userId,
                totalMessages: total_messages.value,
                unreadMessages: total_messages.value - read_messages.doc_count - draft_messages.doc_count
            };

            /**
             * Searching for existing mailbox document
             */
            const searchResponse = await elasticSearchClient.searchDocuments(this.indexName, {
                query: {
                    match: {
                        userId: filter.userId
                    }
                }
            });

            /**
             * Extracting existing document ID
             */
            let existingDocId = (searchResponse[0] as any)?._id?? null;

            /**
             * Upsetting mailbox document
             */
            let upsertResponse: any = {};
            if (existingDocId) {
                upsertResponse = await elasticSearchClient.updateDocument(this.indexName, existingDocId, updateData);
            } else {
                upsertResponse = await elasticSearchClient.createDocument(this.indexName, updateData);
            }

            console.log("Mailbox updated successfully", upsertResponse);
            return responseMessage(200, "Mailbox updated successfully", upsertResponse);
        } catch (error) {
            console.log("Error updating mailbox", error);
            throw new Error(`Error updating mailbox`);
        }
    }

    /**
     * Retrieves mailbox details for a given user ID.
     *
     * @param {any} filter - Filter object containing the user ID.
     * @returns {Promise<any>} A promise that resolves with the mailbox details.
     */
    async getMailBoxDetails(filter: any): Promise<any> {
        try {
            /**
             * Searching for mailbox document
             */
            const response = await elasticSearchClient.searchDocuments(this.indexName, {
                query: {
                    match: {
                        userId: filter.userId
                    }
                }
            });

            return responseMessage(200, "Mailbox details", (response[0]?? {}));
        } catch (error) {
            console.log("Error getting mailbox details", error);
            throw new Error(`Error getting mailbox details`);
        }
    }
}