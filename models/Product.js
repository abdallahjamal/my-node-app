const { dbConnection } = require('../configurations');
const { ObjectId } = require('mongodb');

class Product {
    constructor(data) {
        this.data = data;
        this.data.categoryId = new ObjectId(data.categoryId);
    }



    save(cb) {
        dbConnection('products', async (collection) => {
            try {
                await collection.insertOne(this.data);
                cb({ status: true });
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }

    // static listByCategory(categoryId, cb) {
    //     dbConnection('products', async (collection) => {
    //         try {
    //             const products = await collection.find({ categoryId: new ObjectId(categoryId) }).toArray();
    //             cb({ status: true, data: products });
    //         } catch (err) {
    //             cb({ status: false, message: err.message });
    //         }
    //     });
    // }
static listByCategory(categoryId, cb) {
    dbConnection('products', async (collection) => {
        try {
            const objectId = new ObjectId(categoryId);
            console.log("جاري البحث عن categoryId:", objectId); // أضف هذا السطر
            const products = await collection.find({ categoryId: objectId }).toArray();
            console.log("تم العثور على المنتجات:", products); // أضف هذا السطر
            cb({ status: true, data: products });
        } catch (err) {
            console.error("خطأ في listByCategory:", err.message); // أضف هذا السطر للأخطاء
            cb({ status: false, message: err.message });
        }
    });
}
    
    static getProductById(productId,cb){
         dbConnection('products', async (collection) => {
             try {
              const objectId = new ObjectId(productId);
              const product =await collection.findOne({ _id: new ObjectId(objectId) });
               cb({ status: true, data: product });
             } catch (err) {
                 cb({ status: false, message: err.message });
        }
        
    })};

    static listAll(cb) {
        dbConnection('products', async (collection) => {
            try {
                const products = await collection.find().toArray();
                cb({ status: true, data: products });
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }

async isExist() {
    return new Promise((resolve, reject) => {
        dbConnection("products", async (collection) => {
            try {
                const found = await collection.findOne({ name: this.data.name });
                resolve(!!found);
            } catch (err) {
                reject(err);
            }
        });
    });
}

static update(id, data, cb) {
    dbConnection("products", async (collection) => {
        try {
            await collection.updateOne({ _id: new ObjectId(id) }, { $set: data });
            cb({ status: true });
        } catch (err) {
            cb({ status: false, message: err.message });
        }
    });
}

static delete(id, cb) {
    dbConnection("products", async (collection) => {
        try {
            await collection.deleteOne({ _id: new ObjectId(id) });
            cb({ status: true });
        } catch (err) {
            cb({ status: false, message: err.message });
        }
    });
}

}

module.exports = Product;
