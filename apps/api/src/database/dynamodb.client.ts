import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const isOffline = process.env.IS_OFFLINE === 'true' || process.env.STAGE === 'dev';

const dynamoDbClient = new DynamoDBClient(
  isOffline
    ? {
        region: 'localhost',
        endpoint: 'http://localhost:8000',
        credentials: {
          accessKeyId: 'local',
          secretAccessKey: 'local',
        },
      }
    : {
        region: process.env.AWS_REGION || 'ap-southeast-2',
      }
);

export const docClient = DynamoDBDocumentClient.from(dynamoDbClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
});

export const TABLE_NAME = process.env.DYNAMODB_TABLE || 'dance-school-booking-dev';
export const GSI1_NAME = 'GSI1';
