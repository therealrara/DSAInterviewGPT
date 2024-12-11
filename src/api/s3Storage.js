require('dotenv').config();
const AWS = require('aws-sdk');

// Configure S3 client
const s3 = new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    endpoint: process.env.S3_ENDPOINT, // Example: 'https://your-stackhero-endpoint.com'
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
});

const BUCKET_NAME = process.env.S3_BUCKET; // Replace with your bucket name

 async function s3Upload(array, fileName){
    console.log("Makes it");
    // Convert array to JSON string
    const body = JSON.stringify(array);
    // Upload the file to S3
    const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: body,
        ContentType: 'application/json',
    };
    await s3.putObject(params).promise();
    return fileName;
}

async function generatePresignedUrl(fileName, expiresIn = 300) {
    try {
        if (!fileName || typeof fileName !== "string") {
            throw new Error("Invalid file name provided.");
        }

        console.log("Generating pre-signed URL...");

        const params = {
            Bucket: BUCKET_NAME,
            Key: fileName,
            Expires: expiresIn, // Expiration time in seconds
        };

        const url = s3.getSignedUrl('getObject', params);
        console.log(`Pre-signed URL generated: ${url}`);
        return url;
    } catch (error) {
        console.error("Error generating pre-signed URL:", error.message);
        throw new Error("Failed to generate the pre-signed URL.");
    }
}



module.exports = {s3Upload,generatePresignedUrl};