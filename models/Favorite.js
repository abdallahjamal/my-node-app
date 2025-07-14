const { dbConnection } = require('../configurations');
const { ObjectId } = require('mongodb');

class Favorite {
    constructor(data) {
        // data هنا ستكون { userId, productId }
        this.data = data;
    }

    // التحقق مما إذا كان منتج معين موجودًا بالفعل في مفضلة المستخدم
    async isProductFavorite(userId, productId) {
        return new Promise((resolve, reject) => {
            dbConnection("wishlist_items", async (collection) => {
                try {
                    const found = await collection.findOne({
                        userId: new ObjectId(userId),
                        productId: new ObjectId(productId)
                    });
                    resolve(!!found); // نرجع true/false
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    // إضافة منتج جديد إلى المفضلة
    save(cb) {
        dbConnection("wishlist_items", async (collection) => {
            try {
                // التأكد من أن userId و productId هي ObjectId
                this.data.userId = new ObjectId(this.data.userId);
                this.data.productId = new ObjectId(this.data.productId);

                const result = await collection.insertOne(this.data);
                cb({ status: true, data: { _id: result.insertedId, ...this.data } }); // إرجاع العنصر المضاف مع ID
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }

    // جلب جميع المنتجات المفضلة لمستخدم معين
    static list(userId, cb) {

        dbConnection("wishlist_items", async (collection) => {
            try {

                const favoriteItems = await collection.aggregate([
                    { $match: { userId: new ObjectId(userId) } },
                    {
                        $lookup: {
                            from: "products", 
                            localField: "productId",
                            foreignField: "_id",
                            as: "productDetails"
                        }
                    },
                    { $unwind: "$productDetails" }, // لفك الـ array الناتجة عن lookup
                    {
                        $project: { // تحديد الحقول المراد إرجاعها
                            _id: 1, // ID الخاص بعنصر المفضلة
                            userId: 1,
                            productId: 1,
                            productName: "$productDetails.name",
                            productPrice: "$productDetails.price",
                            productDescription: "$productDetails.description", 
                            productImageUrl: "$productDetails.imageUrl"

                            // أضيفي أي حقول أخرى من المنتج تحتاجينها في التطبيق
                        }
                    }
                ]).toArray();
                cb({ status: true, data: favoriteItems });
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }


    static delete(userId, productId, cb) {
        dbConnection("wishlist_items", async (collection) => {
            try {
                const result = await collection.deleteOne({
                    userId: new ObjectId(userId),
                    productId: new ObjectId(productId)
                });
                if (result.deletedCount === 0) {
                    cb({ status: false, message: "Favorite item not found for this user and product." });
                    return;
                }
                cb({ status: true });
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }
}

module.exports = Favorite;