
const { dbConnection } = require('../configurations');
const { userValidator, loginValidator } = require('../validators');
const { hashSync, compareSync } = require('bcryptjs');
const { ObjectId } = require('mongodb'); 

class Users {
    constructor(userData) {
        this.userData = userData;
    }


    isExist1() {
    return new Promise((resolve, reject) => {
        dbConnection('users', async (collection) => {
            try {
                const user = await collection.findOne({
                    '$or': [
                        { username: this.userData.username },
                        { email: this.userData.email }
                    ]
                });

                if (!user) {
                    resolve({ check: false });
                } else {
                    if (user.email === this.userData.email) {
                        resolve({
                            check: true,
                            message: 'The email is already used'

                        });
                    } else if (user.username === this.userData.username) {
                        resolve({
                            check: true,
                            message: 'The username is already used'

                        });
                    }
                }
            } catch (err) {
                reject(err);
            }
        });
    });
}

 isExist(excludeUserId = null) {
        return new Promise((resolve, reject) => {
            dbConnection('users', async (collection) => {
                try {
                    const query = { '$or': [] };

                    if (this.userData.username) {
                        query['$or'].push({ username: this.userData.username });
                    }
                    if (this.userData.email) {
                        query['$or'].push({ email: this.userData.email });
                    }
                    if (this.userData.phone) { // إضافة التحقق من رقم الهاتف
                        query['$or'].push({ phone: this.userData.phone });
                    }

                    if (query['$or'].length === 0) {
                        return resolve({ check: false }); // لا توجد حقول للتحقق
                    }

                    // استثناء المستخدم الحالي من التحقق إذا تم توفير excludeUserId
                    if (excludeUserId) {
                        query._id = { '$ne': new ObjectId(excludeUserId) };
                    }

                    const user = await collection.findOne(query);

                    if (!user) {
                        resolve({ check: false });
                    } else {
                        // تحديد الحقل المتكرر بدقة
                        if (user.email === this.userData.email) {
                            resolve({ check: true, message: 'The email is already used by another account', field: 'email' });
                        } else if (user.username === this.userData.username) {
                            resolve({ check: true, message: 'The username is already used by another account', field: 'username' });
                        } else if (user.phone === this.userData.phone) { // رسالة خاصة لرقم الهاتف
                            resolve({ check: true, message: 'The phone number is already used by another account', field: 'phone' });
                        } else {
                            // هذا قد يحدث إذا كان هناك تطابق ولكن ليس لأي من الحقول المحددة حالياً
                            resolve({ check: true, message: 'An account with similar details already exists' });
                        }
                    }
                } catch (err) {
                    reject(err);
                }
            });
        });
    }
    
    save(cb) {
        dbConnection('users', async (collection) => {
            try {
                const hashedPassword = hashSync(this.userData.password, 12)
                this.userData.password = hashedPassword

                await collection.insertOne(this.userData)
                    .then(result => {
                        cb({
                            status: true,
                            _user_id: result.insertedId
                        })
                    })

            } catch (err) {
                cb({
                    status: false,
                    message: err.message
                })
            }
        })
    }


    static validate(userData) {
        try {
            return userValidator.validate(userData);
        } catch (err) {
            return { error: { message: 'Validation failed' } };
        }
    }

 

    static login(loginData) {
    return new Promise((resolve, reject) => {
        const validation = loginValidator.validate(loginData);
        if (validation.error) {
            return resolve({
                status: false,
                message: validation.error.message,
                code: 400
            });
        }

        dbConnection("users", async (collection) => {
            try {
                const user = await collection.findOne({ username: loginData.username });

                if (!user || !compareSync(loginData.password, user.password)) {
                    return resolve({
                        status: false,
                        message: "The username or email error",
                        code: 401
                    });
                }

                return resolve({
                    status: true,
                    data: user
                });

            } catch (err) {
                return reject({
                    status: false,
                    message: err.message
                });
            }
        });
    });
}

    static updateUser(userId, updateData) {
        return new Promise(async (resolve, reject) => {
            dbConnection("users", async (collection) => {
                try {
                    // 1. تنظيف البيانات: إزالة الحقول التي لا ينبغي تعديلها
                    const { password, _id, ...dataToUpdate } = updateData;

                    // 2. التحقق من تكرار البيانات الحساسة (username, email, phone)
                    const tempUserInstance = new Users(dataToUpdate); // إنشاء كائن Users مؤقت للتحقق
                    const conflictCheck = await tempUserInstance.isExist(userId); // تمرير userId لاستثنائه من التحقق

                    if (conflictCheck.check) {
                        // إذا وجد تكرار، أرجع رسالة الخطأ المناسبة
                        return resolve({
                            status: false,
                            message: conflictCheck.message,
                            code: 409 // Conflict
                        });
                    }

                    // 3. تنفيذ عملية التحديث الفعلية
                    const result = await collection.updateOne(
                        { _id: new ObjectId(userId) }, // البحث عن المستخدم باستخدام الـ ID
                        { '$set': dataToUpdate }       // تحديد الحقول المراد تحديثها
                    );

                    // 4. التعامل مع نتائج التحديث
                    if (result.matchedCount === 0) {
                        return resolve({
                            status: false,
                            message: "User not found",
                            code: 404
                        });
                    }

                    if (result.modifiedCount === 0) {
                        return resolve({
                            status: false,
                            message: "No changes made, data is identical",
                            code: 200
                        });
                    }

                    // 5. جلب بيانات المستخدم المحدثة وإرجاعها
                    const updatedUser = await collection.findOne({ _id: new ObjectId(userId) });

                    return resolve({
                        status: true,
                        message: "User profile updated successfully",
                        data: updatedUser // إرجاع بيانات المستخدم المحدثة
                    });

                } catch (err) {
                    reject({
                        status: false,
                        message: err.message || "An unexpected error occurred",
                        code: 500
                    });
                }
            });
        });
    }

}


module.exports = Users;

