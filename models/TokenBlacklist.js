const { dbConnection } = require('../configurations');

class TokenBlacklist {

    
    static async add(token) {
        return new Promise((resolve, reject) => {
            dbConnection("blacklisted_tokens", async (collection) => {
                try {
                    await collection.insertOne({ token });
                    resolve(true);
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    static async isBlacklisted(token) {
        return new Promise((resolve, reject) => {
            dbConnection("blacklisted_tokens", async (collection) => {
                try {
                    const result = await collection.findOne({ token });
                    resolve(!!result);
                } catch (err) {
                    reject(err);
                }
            });
        });
    }
}

module.exports = TokenBlacklist;
