import { Client } from "@elastic/elasticsearch";

const esHost = "http://localhost:9200";

export class ElasticSearchService {
  private client: Client;

  constructor() {
    const host = process.env.ELASTICSEARCH_HOST || esHost;
    this.client = new Client({ node: host });
  }

  async createDocument(index: string, document: object,id?: string) {
    try {
      const response = await this.client.index({
        index,
        id,
        body: document
      });
      console.log('Document indexed:', response);
      return this.getDocument(index,response?.body._id);
    } catch (error) {
      console.error('Error indexing document:', error);
    }
  }
  
  async  getDocument(index: string, id: string) {
    try {
      const response = await this.client.get({
        index,
        id
      });
      console.log('Document retrieved:', response.body);
      return response?.body ||{};
    } catch (error) {
      console.error('Error retrieving document:', error);
    }
  }
  
  async updateDocument(index: string, id: string, document: object) {
    try {
      const response = await this.client.update({
        index,
        id,
        body: {
          doc: document
        }
      });
      console.log('Document updated:', response);
      return this.getDocument(index,response?.body._id);
    } catch (error) {
      console.error('Error updating document:', error);
    }
  }
  
  async deleteDocument(index: string, id: string) {
    try {
      const response = await this.client.delete({
        index,
        id
      });
      console.log('Document deleted:', response);
      return response;
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  }
  
  async searchDocuments(index: string, query: object) {
    try {
      const response = await this.client.search({
        index,
        body: {
          query
        }
      });
      console.log('Search results:', response?.body?.hits?.hits);
      return response?.body?.hits?.hits || {}
    } catch (error) {
      console.error('Error searching documents:', error);
    }
  }
  
  async updateOrCreate(index: string, id: string, document: object) {
    try {
      const response = await this.client.update({
        index,
        id,
        body: {
          doc: document,
          doc_as_upsert: true
        }
      });
      console.log('Document updated or created:', response);
      return this.getDocument(index,response?.body._id);
    } catch (error) {
      console.error('Error updating or creating document:', error);
    }
  }
}
