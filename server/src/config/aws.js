import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
if (!process.env.AWS_REGION && !process.env.AWS_DEFAULT_REGION) {
  console.warn(`AWS region not set in environment; defaulting to '${region}'. Set AWS_REGION to your desired region in production.`);
}

AWS.config.update({
  region,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export const dynamoDB = new AWS.DynamoDB.DocumentClient();
export const s3 = new AWS.S3();
export const dynamoDBService = new AWS.DynamoDB();