const { MongoClient } = require('mongodb')
const _uri = process.env.MONGO_URI
const dbConnection = (collectionName, cb) => {
    MongoClient.connect(_uri)
        .then(async (client) => {
            const db = client.db(process.env.MONGO_DB); 

            const collection = db.collection(collectionName); 

            await cb(collection, db); 

            client.close();
        })
        .catch((err) => {
            console.log("DB Connection Error:", err.message);
        });
};

module.exports = dbConnection; 

