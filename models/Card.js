const { dbConnection } = require('../configurations');
const { ObjectId } = require('mongodb');

class Cart {
    constructor(data) {
        this.data = data;
    }

   
    static addOrUpdate(userId, productId, quantity, size, cb) {
        dbConnection("cart_items", async (collection) => {
            try {
                const userObjectId = new ObjectId(userId);
                const productObjectId = new ObjectId(productId);

                const query = {
                    userId: userObjectId,
                    productId: productObjectId
                };
                if (size) {
                    query.size = size;
                }

                const existingItem = await collection.findOne(query);

                let result;
                let message;
                let data = null;

                if (existingItem) {
                    result = await collection.updateOne(
                        { _id: existingItem._id },
                        { $inc: { quantity: quantity } }
                    );
                    message = "تم تحديث كمية عنصر السلة بنجاح.";
                    data = { ...existingItem, quantity: existingItem.quantity + quantity };
                } else {
                    const newItem = {
                        userId: userObjectId,
                        productId: productObjectId,
                        quantity: quantity,
                        size: size
                    };
                    result = await collection.insertOne(newItem);
                    message = "تمت إضافة المنتج إلى السلة بنجاح.";
                    data = { _id: result.insertedId, ...newItem };
                }

                cb({ status: true, message: message, data: data });
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }


    static getUserCart(userId, cb) {
        dbConnection("carts", async (collection) => {
            try {
                const userObjectId = new ObjectId(userId);
                let userCart = await collection.findOne({ userId: userObjectId });
                if (!userCart) {
                    const newUserCart = {
                        userId: userObjectId,
                        appliedCouponId: null,
                        appliedCouponCode: null,
                        discountAmount: 0,
                        subtotal: 0,
                        totalAfterDiscount: 0,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };
                    await collection.insertOne(newUserCart);
                    userCart = newUserCart;
                }
                cb({ status: true, data: userCart });
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }

      // الدالة الأصلية لجلب عناصر السلة مع تفاصيل المنتجات
    static list(userId, cb) {
        dbConnection("cart_items", async (collection) => {
            try {
                const userObjectId = new ObjectId(userId);

                const cartItems = await collection.aggregate([
                    { $match: { userId: userObjectId } },
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
                            _id: 1,
                            userId: 1,
                            productId: 1,
                            quantity: 1,
                            size: 1,
                            productName: "$productDetails.name",
                            productPrice: "$productDetails.price",
                            productImageUrl: "$productDetails.imageUrl"
                        }
                    }
                ]).toArray();

                cb({ status: true, data: cartItems });
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }


    // دالة لتحديث معلومات الكوبون والخصم في سلة المستخدم الرئيسية
    static updateCouponInfo(userId, couponId, couponCode, discountAmount, cb) {
        dbConnection("carts", async (collection) => {
            try {
                const userObjectId = new ObjectId(userId);
                const updateFields = {
                    appliedCouponId: couponId ? new ObjectId(couponId) : null,
                    appliedCouponCode: couponCode,
                    discountAmount: discountAmount,
                    updatedAt: new Date()
                };

                const result = await collection.updateOne(
                    { userId: userObjectId },
                    { $set: updateFields },
                    { upsert: true } 
                );

                cb({ status: true });
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }

       static deleteByIdAndUserId(cartItemId, userId, cb) {
        dbConnection("cart_items", async (collection) => {
            try {
                const result = await collection.deleteOne({
                    _id: new ObjectId(cartItemId),
                    userId: new ObjectId(userId)
                });
                if (result.deletedCount === 0) {
                    cb({ status: false, message: "لم يتم العثور على عنصر السلة أو غير مصرح به." });
                    return;
                }
                cb({ status: true });
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }




    // دالة لإعادة تعيين الكوبون والخصم لسلة المستخدم
    // هذه الدالة ستُستخدم فقط عند تطبيق كوبون جديد أو عند فشل الكوبون السابق
    // وليس عند كل إضافة/حذف لعنصر
    static async resetCouponForUser(userId) {
        return new Promise((resolve, reject) => {
            dbConnection("carts", async (collection) => {
                try {
                    const userObjectId = new ObjectId(userId);
                    await collection.updateOne(
                        { userId: userObjectId },
                        {
                            $set: {
                                appliedCouponId: null,
                                appliedCouponCode: null,
                                discountAmount: 0,
                                updatedAt: new Date()
                            },
                            $setOnInsert: {
                                createdAt: new Date()
                            }
                        },
                        { upsert: true }
                    );
                    resolve({ status: true });
                } catch (err) {
                    reject({ status: false, message: err.message });
                }
            });
        });
    }

  
    // ع الاغلب مش هتلزم لانو دالة الاضافة هيا برضوا بتزيد لو كان العنصر موجود
    static updateQuantityByIdAndUserId(cartItemId, userId, newQuantity, cb) {
        dbConnection("cart_items", async (collection) => {
            try {
                const result = await collection.updateOne(
                    {
                        _id: new ObjectId(cartItemId),
                        userId: new ObjectId(userId)
                    },
                    { $set: { quantity: newQuantity } }
                );
                if (result.matchedCount === 0) {
                    cb({ status: false, message: "لم يتم العثور على عنصر السلة أو غير مصرح به." });
                    return;
                }
                cb({ status: true });
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }

 

}

module.exports = Cart;