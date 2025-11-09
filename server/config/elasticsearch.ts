import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

const elasticsearchClient = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
});

export const INDEX_NAME = 'i-smell-bullshit-blog';
export const COMMENTS_INDEX = 'i-smell-bullshit-comments';

export const createIndex = async (): Promise<void> => {
  try {
    const indexExists = await elasticsearchClient.indices.exists({
      index: INDEX_NAME,
    });

    if (!indexExists) {
      await elasticsearchClient.indices.create({
        index: INDEX_NAME,
        body: {
          mappings: {
            properties: {
              title: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                  },
                },
              },
              content: {
                type: 'text',
              },
              author: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                  },
                },
              },
              email: {
                type: 'keyword',
              },
              ipAddress: {
                type: 'ip',
              },
              createdAt: {
                type: 'date',
              },
              tags: {
                type: 'keyword',
              },
            },
          },
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1,
          },
        },
      });
      console.log(`Index "${INDEX_NAME}" created successfully`);
    } else {
      console.log(`Index "${INDEX_NAME}" already exists`);
    }

    // Create comments index
    const commentsIndexExists = await elasticsearchClient.indices.exists({
      index: COMMENTS_INDEX,
    });

    if (!commentsIndexExists) {
      await elasticsearchClient.indices.create({
        index: COMMENTS_INDEX,
        body: {
          mappings: {
            properties: {
              postId: {
                type: 'keyword',
              },
              content: {
                type: 'text',
              },
              author: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                  },
                },
              },
              ipAddress: {
                type: 'ip',
              },
              createdAt: {
                type: 'date',
              },
              reactions: {
                type: 'object',
                properties: {
                  like: { type: 'integer' },
                  love: { type: 'integer' },
                  angry: { type: 'integer' },
                  laugh: { type: 'integer' },
                  bs: { type: 'integer' },
                },
              },
            },
          },
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1,
          },
        },
      });
      console.log(`Index "${COMMENTS_INDEX}" created successfully`);
    } else {
      console.log(`Index "${COMMENTS_INDEX}" already exists`);
    }
  } catch (error) {
    console.error('Error creating index:', error);
    throw error;
  }
};

export const testConnection = async (): Promise<boolean> => {
  try {
    const health = await elasticsearchClient.cluster.health({});
    console.log('Elasticsearch connection successful:', health.status);
    return true;
  } catch (error) {
    console.error('Elasticsearch connection failed:', error);
    return false;
  }
};

export default elasticsearchClient;
