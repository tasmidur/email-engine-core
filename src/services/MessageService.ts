import {ElasticSearchService} from './ElasticSearchService';
import {MAIL_MESSAGE_INDEX} from "../utils/Constant";
import {responseMessage} from "../utils/helpers";

const elasticSearchClient = new ElasticSearchService();

export class MessageService {
    private indexName: string = MAIL_MESSAGE_INDEX;

    async createMessage(message: any): Promise<any> {
        try {
            const createMessage = await elasticSearchClient.createDocument(this.indexName, message);
            return responseMessage(200, 'Message created successfully', createMessage)
        } catch (error) {
            return responseMessage(500, 'Error creating message');
        }
    }

    async searchMessage(query: object): Promise<any> {
        return await elasticSearchClient.searchDocuments(this.indexName, query);
    }

    async syncMessages(messages: any): Promise<any> {
        const operations: any[] = [];
        for (const doc of messages) {
            const query = {
                match: {
                    messageId: doc.messageId
                }
            };
            const existingDocId = await elasticSearchClient.searchDocuments(this.indexName, query);
            if (existingDocId) {
                operations.push(
                    {update: {_index: this.indexName, _id: existingDocId}},
                    {doc: doc}
                );
            } else {
                operations.push(
                    {index: {_index: this.indexName}},
                    doc
                );
            }
        }
        console.log(operations)
        return await elasticSearchClient.bulkUpsert(operations);
    }




    // async upsertMessage(dataset: any): Promise<any> {
    //
    //     const operations = dataset.flatMap((doc: any) => [
    //         {
    //             update: {
    //                 _index: this.indexName,
    //                 script: {
    //                     source: 'ctx._source.messageId == params.messageId ? ctx._source : params.doc',
    //                     lang: 'painless',
    //                     params: {messageId: doc.messageId, doc: doc}
    //                 },
    //                 upsert: doc
    //             }
    //         }
    //     ]);
    //
    //     const bulkResponse = await elasticSearchClient.bulk({refresh: true, operations});
    //
    //     if (bulkResponse.errors) {
    //         const erroredDocuments = [];
    //         bulkResponse.items.forEach((action, i) => {
    //             const operation = Object.keys(action)[0];
    //             if (action[operation].error) {
    //                 erroredDocuments.push({
    //                     status: action[operation].status,
    //                     error: action[operation].error,
    //                     operation: operations[i],
    //                     document: dataset[i]
    //                 });
    //             }
    //         });
    //         console.log(erroredDocuments);
    //     }
    //
    //     const count = await client.count({index: 'tweets'});
    //     console.log(count);
    // }
}
