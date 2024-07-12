import {Client} from "@elastic/elasticsearch";
import * as dotenv from 'dotenv'; // Import dotenv module
dotenv.config();

/**
 * Class representing an Elasticsearch client.
 */
export class ElasticSearchClient {
    private client: Client;

    /**
     * Create an Elasticsearch client instance.
     */
    constructor() {
        const host = process.env.ELASTICSEARCH_HOST || '';
        console.log("Elasticsearch host:", host)
        this.client = new Client({
            node: host,
            auth:{
                username:process.env.ELASTIC_USERNAME||'',
                password:process.env.ELASTIC_PASSWORD||''
            }
        });
    }

    /**
     * Get the Elasticsearch client instance.
     * @returns {Client} The Elasticsearch client instance.
     */
    getEsInstance(): Client {
        return this.client;
    }

    /**
     * Initializes Elasticsearch indices and mappings.
     *
     * @param {({ index: string; body: any }[])} indices - An array of objects containing the index name and mapping body.
     *
     * @returns {Promise<void>} A promise that resolves when the indices and mappings are created successfully.
     *
     * @throws {Error} If an error occurs while creating the indices or mappings.
     */
    async initElasticsearch(indices: { index: string; body: any }[]): Promise<void> {
        try {
            const indexNames: string[] = [];
            await Promise.all(indices.map(async ({index, body: {settings, mappings}}) => {
                    if ((await this.client.indices.exists({index}).then((response: any) => response.statusCode === 404))) {
                        await this.client.indices.create({index, body: {
                                settings: settings
                            }
                        });
                    }
                    await this.client.indices.putMapping({index, body: {...mappings}});
                    indexNames.push(index);
                }
            ))
            ;
            console.log(`Elasticsearch indices ${indexNames.join(", ")} created and mapped successfully`);
        } catch
            (error) {
            console.error(`Error creating Elasticsearch indices or mapping: ${error}`);
            throw new Error('Error creating Elasticsearch indices or mapping');
        }
    }

    /**
     * Create or update a document in Elasticsearch.
     * @param {string} index - The name of the index.
     * @param {object} document - The document to be indexed.
     * @param {string} [id] - The ID of the document (optional).
     * @returns {Promise<any>} The indexed document.
     */
    async createDocument(index: string, document: object, id ?: string): Promise<any> {
        try {
            const response = await this.client.index({
                index,
                id,
                body: document,
                refresh: true,
            });
            return this.getDocument(index, response.body._id);
        } catch (error) {
            console.error("Error indexing document:", error);
            throw new Error("Error indexing document")
        }
    }

    /**
     * Retrieve a document from Elasticsearch.
     * @param {string} index - The name of the index.
     * @param {string} id - The ID of the document.
     * @returns {Promise<any>} The retrieved document.
     */
    async getDocument(index: string, id: string): Promise<any> {
        try {
            const response = await this.client.get({
                index,
                id,
            });
            return response.body || {};
        } catch (error) {
            console.error("Error retrieving document:", error);
            throw new Error("Error retrieving document");
        }
    }

    /**
     * Retrieve documents with pagination from Elasticsearch.
     * @param {string} index - The name of the index.
     * @param {object} query - The query to search documents.
     * @param {number} [size=10] - The number of documents per page.
     * @param {number} [from=0] - The starting point of documents.
     * @returns {Promise<{total: number, data: any[], nextPage: number | null}>} The retrieved documents with pagination information.
     */
    async getDocumentWithPagination(index: string, query: object, size: number = 10, from: number = 0): Promise<{
        total: number;
        data: any[];
        nextPage: number | null;
    }> {
        try {
            const response = await this.client.search({
                index,
                body: {
                    query,
                    sort: [
                        {"updateAt": {order: "desc"}},
                        {"createAt": {order: "desc"}},
                    ],
                    size,
                    from,
                },
            });

            const hits = response.body.hits.hits;
            const total = response.body.hits.total.value;
            const data = hits;
            const nextPage = hits.length === size ? from + size : null;
            return {total, data, nextPage};
        } catch (error) {
            console.error("Error searching documents:", error);
            throw new Error("Error searching documents");
        }
    }

    /**
     * Update a document in Elasticsearch.
     * @param {string} index - The name of the index.
     * @param {string} id - The ID of the document.
     * @param {object} document - The document to be updated.
     * @returns {Promise<any>} The updated document.
     */
    async updateDocument(index: string, id: string, document: object): Promise<any> {
        try {
            const response = await this.client.update({
                index,
                id,
                body: {
                    doc: document,
                },
                refresh: true,
            });
            return this.getDocument(index, response.body._id);
        } catch (error) {
            console.error("Error updating document:", error);
            throw new Error("Error updating document");
        }
    }

    /**
     * Delete documents from Elasticsearch based on a query.
     * @param {string} index - The name of the index.
     * @param {object} query - The query to delete documents.
     * @returns {Promise<any>} The response of the delete operation.
     */
    async deleteDocument(index: string, query: object): Promise<any> {
        try {
            const response = await this.client.deleteByQuery({
                index,
                body: {
                    ...query,
                },
                refresh: true,
            });
            return response.body;
        } catch (error) {
            console.error("Error deleting document:", error);
            throw new Error("Error deleting document");
        }
    }

    /**
     * Search for documents in Elasticsearch.
     * @param {string} index - The name of the index.
     * @param {object} query - The query to search documents.
     * @returns {Promise<object[]>} The matched documents.
     */
    async searchDocuments(index: string, query: object): Promise<object[]> {
        try {
            const response = await this.client.search({
                index,
                body: {
                    ...query,
                },
            });
            const hits = response.body.hits.hits;
            return hits.length > 0 ? hits : [];
        } catch (error) {
            console.error("Error searching documents:", error);
            throw new Error("Error searching documents");
        }
    }

    /**
     * Bulk upsert documents in Elasticsearch.
     * @param {any[]} operations - The bulk operations.
     * @returns {Promise<any>} The response of the bulk upsert operation.
     */
    async bulkUpsert(operations: any[]): Promise<any> {
        try {
            const {body: bulkResponse} = await this.client.bulk({
                body: operations,
                refresh: true,
            });

            if (bulkResponse.errors
            ) {
                const erroredDocuments: any[] = [];
                bulkResponse.items.forEach((action: any, i: number) => {
                    const operation = Object.keys(action)[0];
                    if (action[operation].error) {
                        erroredDocuments.push({
                            status: action[operation].status,
                            error: action[operation].error,
                            operation: operations[i * 2],
                            document: operations[i * 2 + 1],
                        });
                    }
                });
                console.log("Bulk upsert errors:", erroredDocuments);
                return {status: 200, message: "Bulk upsert errors",erroredDocuments};
            } else {
                console.log("Bulk upsert successful");
                return {status: 200, message: "Bulk upsert successful"};
            }
        } catch
            (error) {
            console.error("Elasticsearch bulk upsert error:", error);
            throw new Error("Elasticsearch bulk upsert error");
        }
    }
}