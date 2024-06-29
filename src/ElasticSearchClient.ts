// src/ElasticSearchClient.ts
import { Client } from '@elastic/elasticsearch';

export class ElasticSearchClient {
  private client: Client;

  constructor() {
      const host = process.env.ELASTICSEARCH_HOST || 'http://localhost:9200';
      this.client = new Client({ node: host });
  }

    async saveMessage(index: string, message: any): Promise<void> {
        try {
            await this.client.index({
                index,
                body: message
            });
            await this.client.indices.refresh({ index });
        } catch (error) {
            console.error('Error saving message to Elasticsearch:', error);
        }
    }

    async createOrUpdateDocument(index: string, message:any,sourceId?: string): Promise<void> {
        try {
          // Search for the document with the specified source ID
          const searchResponse = await  this.client.search({
            index: index,
            body: {
              query: {
                match: {
                  ["id"]: sourceId
                }
              }
            }
          });
          console.log("search",JSON.stringify(searchResponse,null,2),message,sourceId);
          
          let response;
          if (searchResponse.body.hits.total.value === 0) {
            // Document not found, create a new one
            response = await  this.client.index({
              index: index,
              body: { ...message, ["id"]: sourceId } // Ensure the source ID is included in the new document
            });
            console.log('Document created successfully:', response);
          } else {
            // Document found, update it
            const docId = searchResponse.body.hits.hits[0]._id;
            response = await  this.client.update({
              index: index,
              id: docId,
              body: {
                doc: message
              }
            });
            console.log('Document updated successfully:', response);
          }
        } catch (error) {
          console.error('Error creating or updating document:', error);
        }
      }
}
