import { Client } from "@elastic/elasticsearch";

const esHost = "http://localhost:9200";

export class ElasticSearchService {
  private client: Client;

  constructor() {
    const host = process.env.ELASTICSEARCH_HOST || esHost;
    this.client = new Client({ node: host });
  }

  async createIndex(index: string, schema: any) {
    try {
      const exists = await this.client.indices.exists({ index });
      if (!exists.body) {
        await this.client.indices.create(schema);
        console.log(`Index created: ${index}`);
      }
    } catch (error) {
      console.error("Error creating index:", error);
    }
  }

  async createDocument(index: string, document: object, id?: string) {
    try {
      const response = await this.client.index({
        index,
        id,
        body: document,
      });
      console.log("Document indexed:", response);
      return this.getDocument(index, response?.body._id);
    } catch (error) {
      console.error("Error indexing document:", error);
    }
  }

  async getDocument(index: string, id: string) {
    try {
      const response = await this.client.get({
        index,
        id,
      });
      console.log("Document retrieved:", response.body);
      return response?.body || {};
    } catch (error) {
      console.error("Error retrieving document:", error);
    }
  }

  async updateDocument(index: string, id: string, document: object) {
    try {
      const response = await this.client.update({
        index,
        id,
        body: {
          doc: document,
        },
      });
      console.log("Document updated:", response);
      return this.getDocument(index, response?.body._id);
    } catch (error) {
      console.error("Error updating document:", error);
    }
  }

  async deleteDocument(index: string, id: string) {
    try {
      const response = await this.client.delete({
        index,
        id,
      });
      console.log("Document deleted:", response);
      return response;
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  }

  async searchDocuments(index: string, query: object) {
    try {
      const response = await this.client.search({
        index,
        body: {
          query: query,
        },
      });
      const hits = response?.body?.hits?.hits;
      return hits.length > 0 ? hits : [];
    } catch (error) {
      console.error("Error searching documents:", error);
      throw new Error("Error searching documents");
    }
  }

  async updateOrCreate(index: string, id: string, document: object) {
    try {
      const response = await this.client.update({
        index,
        id,
        body: {
          doc: document,
          doc_as_upsert: true,
        },
      });
      console.log("Document updated or created:", response);
      return this.getDocument(index, response?.body._id);
    } catch (error) {
      console.error("Error updating or creating document:", error);
    }
  }

  async bulkUpsert(operations: any[]): Promise<any> {
    try {
      const { body: bulkResponse } = await this.client.bulk({
        refresh: true,
        body: operations,
      });

      if (bulkResponse.errors) {
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
        return erroredDocuments;
      } else {
        console.log("Bulk upsert successful");
        return { status: 200, message: "Bulk upsert successful" };
      }
    } catch (error) {
      console.error("Elasticsearch bulk upsert error:", error);
    }
  }
}
