

// Replace with your Heroku Redis URL
const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL);
// Internal method to get the array from Redis
async function getArray(key) {
    const jsonString = await redis.get(key);
    console.log(jsonString);
    return jsonString ? JSON.parse(jsonString) : [];
}

// Internal method to store the array back in Redis
async function storeArray(key, array) {
    const jsonString = JSON.stringify(array);
    const ttlInSeconds = await redis.ttl(key) * 1000; // TTL in seconds
    const currentTimeInSeconds = Date.now();
    const defaultTTL = process.env.REDIS_TTL * 1000; // Ensure it's an integer

    let absoluteExpiration;

    if (array.length > 1 && ttlInSeconds > 0) {
        // Reuse existing TTL as absolute expiration time
        absoluteExpiration = currentTimeInSeconds + (ttlInSeconds);
    } else {
        // Set a new TTL
        absoluteExpiration = currentTimeInSeconds + defaultTTL;
    }

    console.log(absoluteExpiration)
    absoluteExpiration = Math.floor(absoluteExpiration / 1000);

    // Save the key with updated value
    await redis.set(key, jsonString);
    // Set expiration time
    await redis.expireat(key, absoluteExpiration);

    console.log(`Key ${key} will expire at ${new Date(absoluteExpiration * 1000).toISOString()}`);
}


// Public method to add an object to the array
async function addObjectToArray(key, newObject) {
    console.log(key)
    const array = await getArray(key); // Get the existing array
    array.push(newObject); // Add the new object
    await storeArray(key, array); // Store the updated array back
    console.log(`New object added to array under key "${key}":`, newObject);
}

// Public method to retrieve the array
async function getCurrentArray(key) {
    const array = await getArray(key);
    console.log(`Array retrieved from Redis under key "${key}":`, array);
    if (!Array.isArray(array)) {
        throw new Error('Messages must be an array of objects.');
    }
    return array;
}

module.exports = {
    addObjectToArray,
    getCurrentArray,
};