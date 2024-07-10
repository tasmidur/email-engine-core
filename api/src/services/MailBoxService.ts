import {MAIL_MESSAGE_INDEX, MAILBOX_INDEX} from "../utils/Constant";
import {responseMessage} from "../utils/helpers";
import {ElasticSearchClient} from "../ElasticSearchClient";
import {MailBoxSchema} from "../models/MailBox";

const elasticSearchClient = new ElasticSearchClient();

export class MailBoxService {
    private indexName: string = MAILBOX_INDEX;

    constructor() {
        elasticSearchClient
            .createIndex(this.indexName, MailBoxSchema)
            .then((res) => {
            });
    }

    async updateMailBoxDetails(filter: any): Promise<any> {
        try {
            const response = await elasticSearchClient.getEsInstance().search({
                index: MAIL_MESSAGE_INDEX,
                body:
                    {
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

            const {aggregations: {draft_messages, read_messages, total_messages}} = response.body;

            const updateData = {
                userId: filter.userId,
                totalMessages: total_messages.value,
                unreadMessages: total_messages.value - read_messages.doc_count - draft_messages.doc_count
            };

            const searchResponse = await elasticSearchClient.searchDocuments(this.indexName, {
                query: {
                    match: {
                        userId: filter.userId
                    }
                }
            });
            let existingDocId = searchResponse[0]?._id ?? null;
            let upsertResponse:any = {};
            if (existingDocId) {
                upsertResponse = await elasticSearchClient.updateDocument(this.indexName, existingDocId, updateData);
            } else {
                upsertResponse = await elasticSearchClient.createDocument(this.indexName, updateData);
            }
            console.log("Mailbox updated successfully", upsertResponse)
            return responseMessage(200, "Mailbox updated successfully", upsertResponse);
        } catch (error) {
            console.log("Error updating mailbox", error)
            return responseMessage(500, "Error updating mailbox");
        }
    }

    async getMailBoxDetails(filter: any): Promise<any> {
        try {
            const response = await elasticSearchClient.searchDocuments(this.indexName, {
                query: {
                    match: {
                        userId: filter.userId
                    }
                }
            });
            return responseMessage(200, "Mailbox details", (response[0]??{}));
        } catch (error) {
            console.log("Error getting mailbox details", error)
            return responseMessage(500, "Error getting mailbox details");
        }
    }

}