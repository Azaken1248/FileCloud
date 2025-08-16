import { dynamoDBService } from "../config/aws.js";

export const ensureTableExists = async () => {
    const paramsUsersTable = {
        TableName: "Users",
        AttributeDefinitions: [
            { AttributeName: "email", AttributeType: "S" },
        ],
        KeySchema: [
            { AttributeName: "email", KeyType: "HASH" },
        ],
        BillingMode: "PAY_PER_REQUEST",
    };

    const paramsFilesTable = {
        TableName: "Files",
        AttributeDefinitions: [
            { AttributeName: "fileId", AttributeType: "S" },
        ],
        KeySchema: [
            { AttributeName: "fileId", KeyType: "HASH" },
        ],
        BillingMode: "PAY_PER_REQUEST",
    };

    try {
        const existingTables = await dynamoDBService.listTables().promise();
        if (!existingTables.TableNames.includes("Users")) {
            console.log("Table 'Users' does not exist. Creating it...");
            await dynamoDBService.createTable(paramsUsersTable).promise();
            console.log("Table 'Users' created successfully.");
        } else {
            console.log("Table 'Users' already exists.");
        }

        if (!existingTables.TableNames.includes("Files")) {
            console.log("Table 'Files' does not exist. Creating it...");
            await dynamoDBService.createTable(paramsFilesTable).promise();
            console.log("Table 'Files' created successfully.");
        } else {
            console.log("Table 'Files' already exists.");
        }
    } catch (err) {
        console.error("Error ensuring tables exist:", err);
        throw err;
    }
};