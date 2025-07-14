const { Coupon } = require('../models');
const { returnJson } = require('../my_modules/json_response');
const createError = require('http-errors');


const createCoupon = (req, res, next) => {
    const newCouponData = req.body;
    const couponCode = newCouponData.code;

    // 🆕 استدعاء isExist كدالة ثابتة على الكلاس Coupon
    Coupon.isExist(couponCode, (existsResult) => {
        if (!existsResult.status) {
            return next(createError(500, existsResult.message));
        }

        if (existsResult.data) { // إذا كانت النتيجة true، فهذا يعني أنه موجود
            return returnJson(res, 409, false, "رمز الكوبون موجود بالفعل", null);
        }

        const coupon = new Coupon(newCouponData); // إذا لم يكن موجودًا، فقم بإنشاء الكوبون

        coupon.save((saveResult) => {
            if (saveResult.status) {
                return returnJson(res, 201, true, "تم إنشاء الكوبون", null);
            } else {
                return next(createError(500, saveResult.message));
            }
        });
    });
};


const getCoupons = (req, res, next) => {
    Coupon.listAll((result) => {
        if (result.status) {
            return returnJson(res, 200, true, "تم جلب جميع الكوبونات", result.data);
        } else {
            return next(createError(500, result.message));
        }
    });
};


const getCoupon = (req, res, next) => {
    const id = req.params.id;
    Coupon.findById(id, (result) => {
        if (result.status) {
            return returnJson(res, 200, true, "تم جلب الكوبون", result.data);
        } else {
            return next(createError(result.message === "لم يتم العثور على الكوبون" ? 404 : 500, result.message));
        }
    });
};


const updateCoupon = (req, res, next) => {
    const id = req.params.id;
    const data = req.body;

    Coupon.update(id, data, (result) => {
        if (result.status) {
            return returnJson(res, 200, true, "Update Copone Successffuly", null);
        } else {
            return next(createError(result.message === "These Compone Not Found" ? 404 : 500, result.message));
        }
    });
};


const deleteCoupon = (req, res, next) => {
    const id = req.params.id;

    // 🆕 استخدام Coupon.delete التي تم إضافتها في models/coupon.js
    Coupon.delete(id, (result) => {
        if (result.status) {
            return returnJson(res, 200, true, "Delete Successffuly", null);
        } else {
            return next(createError(result.message === "لم يتم العثور على الكوبون" ? 404 : 500, result.message));
        }
    });
};



module.exports = {
    createCoupon,
    getCoupons,
    getCoupon,
    updateCoupon,
    deleteCoupon
};