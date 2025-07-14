// const { dbConnection } = require('../configurations');
// const { ObjectId } = require('mongodb');


// class Coupon {


//     constructor(data) {
//         this.data = data;
//         // تحويل تاريخ الانتهاء إلى Date object إذا كان موجوداً ومختلفاً عن null
//         if (this.data.expiresAt && typeof this.data.expiresAt === 'string') {
//             this.data.expiresAt = new Date(this.data.expiresAt);
//         } else if (!this.data.expiresAt) {
//             this.data.expiresAt = null; // تأكد من أنه null إذا لم يتم تحديده
//         }

//         // إعداد القيم الافتراضية إذا لم يتم توفيرها
//         this.data.isActive = typeof this.data.isActive === 'boolean' ? this.data.isActive : true;
//         this.data.minOrderAmount = typeof this.data.minOrderAmount === 'number' ? this.data.minOrderAmount : 0;
//         this.data.maxDiscountAmount = typeof this.data.maxDiscountAmount === 'number' ? this.data.maxDiscountAmount : null;
//         this.data.usageLimit = typeof this.data.usageLimit === 'number' ? this.data.usageLimit : null;
//         this.data.usedCount = typeof this.data.usedCount === 'number' ? this.data.usedCount : 0;
//         this.data.usersUsed = Array.isArray(this.data.usersUsed) ? this.data.usersUsed.map(id => new ObjectId(id)) : [];
//         this.data.code = this.data.code ? this.data.code.toUpperCase().trim() : ''; // تحويل الكود إلى أحرف كبيرة
//     }

//     // حفظ كوبون جديد
//     save(cb) {
//         dbConnection("coupons", async (collection) => {
//             try {
//                 // إضافة حقول createdAt و updatedAt يدوياً بما أننا لا نستخدم Mongoose timestamps
//                 const now = new Date();
//                 this.data.createdAt = now;
//                 this.data.updatedAt = now;

//                 await collection.insertOne(this.data);
//                 cb({ status: true });
//             } catch (err) {
//                 cb({ status: false, message: err.message });
//             }
//         });
//     }

//     // تحديث كوبون موجود
//     static update(id, data, cb) {
//         dbConnection("coupons", async (collection) => {
//             try {
//                 const updateData = { ...data };
//                 // تحويل تاريخ الانتهاء إذا تم تحديثه
//                 if (updateData.expiresAt && typeof updateData.expiresAt === 'string') {
//                     updateData.expiresAt = new Date(updateData.expiresAt);
//                 } else if (updateData.expiresAt === null) {
//                      updateData.expiresAt = null;
//                 }
//                 // تحويل usersUsed إذا تم تحديثها
//                 if (updateData.usersUsed && Array.isArray(updateData.usersUsed)) {
//                     updateData.usersUsed = updateData.usersUsed.map(userId => new ObjectId(userId));
//                 }
//                 if (updateData.code) {
//                     updateData.code = updateData.code.toUpperCase().trim();
//                 }
//                 updateData.updatedAt = new Date(); // تحديث حقل updatedAt

//                 const result = await collection.updateOne(
//                     { _id: new ObjectId(id) },
//                     { $set: updateData }
//                 );
//                 if (result.matchedCount === 0) {
//                     return cb({ status: false, message: "Coupon not found" });
//                 }
//                 cb({ status: true });
//             } catch (err) {
//                 cb({ status: false, message: err.message });
//             }
//         });
//     }

//     // حذف كوبون
//     static delete(id, cb) {
//         dbConnection("coupons", async (collection) => {
//             try {
//                 const result = await collection.deleteOne({ _id: new ObjectId(id) });
//                 if (result.deletedCount === 0) {
//                     return cb({ status: false, message: "Coupon not found" });
//                 }
//                 cb({ status: true });
//             } catch (err) {
//                 cb({ status: false, message: err.message });
//             }
//         });
//     }

//     // جلب كل الكوبونات
//     static listAll(cb) {
//         dbConnection('coupons', async (collection) => {
//             try {
//                 const coupons = await collection.find({}).toArray();
//                 cb({ status: true, data: coupons });
//             } catch (err) {
//                 cb({ status: false, message: err.message });
//             }
//         });
//     }

//     // جلب كوبون واحد بالـ ID
//     static findById(id, cb) {
//         dbConnection('coupons', async (collection) => {
//             try {
//                 const coupon = await collection.findOne({ _id: new ObjectId(id) });
//                 if (!coupon) {
//                     return cb({ status: false, message: "Coupon not found" });
//                 }
//                 cb({ status: true, data: coupon });
//             } catch (err) {
//                 cb({ status: false, message: err.message });
//             }
//         });
//     }

//     // جلب كوبون واحد بالـ Code (مهم لتطبيق الكوبون)
//     static findByCode(code, cb) {
//         dbConnection('coupons', async (collection) => {
//             try {
//                 const coupon = await collection.findOne({ code: code.toUpperCase().trim() });
//                 if (!coupon) {
//                     return cb({ status: false, message: "Coupon not found" });
//                 }
//                 cb({ status: true, data: coupon });
//             } catch (err) {
//                 cb({ status: false, message: err.message });
//             }
//         });
//     }

//     // التحقق مما إذا كان الكوبون موجوداً بالفعل (خاصة بالكود)
//     async isExist() {
//         return new Promise((resolve, reject) => {
//             dbConnection("coupons", async (collection) => {
//                 try {
//                     const found = await collection.findOne({ code: this.data.code });
//                     resolve(!!found);
//                 } catch (err) {
//                     reject(err);
//                 }
//             });
//         });
//     }

//     // زيادة عداد الاستخدام وإضافة المستخدم للكوبون
//     static incrementUsage(couponId, userId, cb) {
//         dbConnection("coupons", async (collection) => {
//             try {
//                 const result = await collection.updateOne(
//                     { _id: new ObjectId(couponId) },
//                     { 
//                         $inc: { usedCount: 1 }, // زيادة عداد الاستخدام
//                         $addToSet: { usersUsed: new ObjectId(userId) }, // إضافة المستخدم إذا لم يكن موجوداً
//                         $set: { updatedAt: new Date() } // تحديث تاريخ التعديل
//                     }
//                 );
//                 if (result.matchedCount === 0) {
//                     return cb({ status: false, message: "Coupon not found for usage increment" });
//                 }
//                 cb({ status: true });
//             } catch (err) {
//                 cb({ status: false, message: err.message });
//             }
//         });
//     }

    
// }

// module.exports = Coupon;
const { dbConnection } = require('../configurations');
const { ObjectId } = require('mongodb');

class Coupon {
    constructor(data) {
        this.data = data;
        // تحويل تاريخ الانتهاء إلى Date object إذا كان موجوداً ومختلفاً عن null
        if (this.data.expiresAt && typeof this.data.expiresAt === 'string') {
            this.data.expiresAt = new Date(this.data.expiresAt);
        } else if (!this.data.expiresAt) {
            this.data.expiresAt = null; // تأكد من أنه null إذا لم يتم تحديده
        }

        this.data.isActive = typeof this.data.isActive === 'boolean' ? this.data.isActive : true;
        this.data.minOrderAmount = typeof this.data.minOrderAmount === 'number' ? this.data.minOrderAmount : 0;
        this.data.maxDiscountAmount = typeof this.data.maxDiscountAmount === 'number' ? this.data.maxDiscountAmount : null;
        this.data.usageLimit = typeof this.data.usageLimit === 'number' ? this.data.usageLimit : null;
        this.data.usedCount = typeof this.data.usedCount === 'number' ? this.data.usedCount : 0;
        this.data.usersUsed = Array.isArray(this.data.usersUsed) ? this.data.usersUsed.map(id => new ObjectId(id)) : [];
        this.data.code = this.data.code ? this.data.code.toUpperCase().trim() : '';
    }

    save(cb) {
        dbConnection("coupons", async (collection) => {
            try {
                // إضافة حقول createdAt و updatedAt يدوياً بما أننا لا نستخدم Mongoose timestamps
                const now = new Date();
                this.data.createdAt = now;
                this.data.updatedAt = now;

                await collection.insertOne(this.data);
                cb({ status: true });
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }

    static isExist(code, cb) {
        dbConnection("coupons", async (collection) => {
            try {
                const existingCoupon = await collection.findOne({ code: code.toUpperCase().trim() });
                cb({ status: true, data: existingCoupon !== null }); // إرجاع true إذا كان موجودًا، false بخلاف ذلك
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }

    static findById(id, cb) {
        dbConnection('coupons', async (collection) => {
            try {
                const coupon = await collection.findOne({ _id: new ObjectId(id) });
                if (!coupon) {
                    return cb({ status: false, message: "لم يتم العثور على الكوبون" });
                }
                cb({ status: true, data: coupon });
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }

    static findByCode(code, cb) {
        dbConnection('coupons', async (collection) => {
            try {
                const coupon = await collection.findOne({ code: code.toUpperCase().trim() });
                if (!coupon) {
                    return cb({ status: false, message: "لم يتم العثور على الكوبون" });
                }
                cb({ status: true, data: coupon });
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }

    static incrementUsage(couponId, userId, cb) {
        dbConnection('coupons', async (collection) => {
            try {
                const result = await collection.updateOne(
                    { _id: new ObjectId(couponId) },
                    {
                        $inc: { usedCount: 1 },
                        $addToSet: { usersUsed: new ObjectId(userId) }
                    }
                );
                if (result.matchedCount === 0) {
                    return cb({ status: false, message: "Thes Copone Not Found To Increment Usage" });
                }
                cb({ status: true });
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }

    static listAll(cb) {
        dbConnection('coupons', async (collection) => {
            try {
                const coupons = await collection.find({}).toArray();
                cb({ status: true, data: coupons });
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }

    static update(id, data, cb) {
        dbConnection('coupons', async (collection) => {
            try {
                const now = new Date();
                const updateData = { ...data, updatedAt: now };

                const result = await collection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.matchedCount === 0) {
                    return cb({ status: false, message: "These Copone Not Found" });
                }
                cb({ status: true });
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }

    static delete(id, cb) {
        dbConnection('coupons', async (collection) => {
            try {
                const result = await collection.deleteOne({ _id: new ObjectId(id) });
                if (result.deletedCount === 0) {
                    return cb({ status: false, message: "Thes Copone Not Found." });
                }
                cb({ status: true });
            } catch (err) {
                cb({ status: false, message: err.message });
            }
        });
    }
}

module.exports = Coupon;