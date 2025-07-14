const { dbConnection } = require('../configurations');
const { ObjectId } = require('mongodb');



class Category {
    constructor(data) {
        this.data = data;
    }

    async isExist() {
        return new Promise((resolve, reject) => {
            dbConnection("categories", async (collection) => {
                try {
                    const found = await collection.findOne({ name: this.data.name });
                    resolve(!!found);
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    save(cb) {
        dbConnection("categories", async (collection) => {
            try {
                await collection.insertOne(this.data);
                cb({ status: true });
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }

    static list(cb) {
        dbConnection("categories", async (collection) => {
            try {
                const categories = await collection.find().toArray();
                cb({ status: true, data: categories });
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }

    static update(id, data, cb) {
        dbConnection("categories", async (collection) => {
            try {
                await collection.updateOne({ _id: new ObjectId(id) }, { $set: data });
                cb({ status: true });
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }

    static delete(id, cb) {
        dbConnection("categories", async (collection) => {
            try {
                await collection.deleteOne({ _id: new ObjectId(id) });
                cb({ status: true });
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }
}


module.exports = Category;
