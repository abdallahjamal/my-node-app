const { Cart, Coupon } = require('../models'); 
const createError = require('http-errors');
const { returnJson } = require('../my_modules/json_response');
const { ObjectId } = require('mongodb'); 



const calculateCartSubtotal = (cartItems) => {
    let subtotal = 0;
    if (!cartItems || cartItems.length === 0) {
        return 0;
    }


    for (const item of cartItems) {
        const price = parseFloat(item.productPrice);
        if (isNaN(price)) {
            console.error(`Invalid product price for item ${item.productId}: ${item.productPrice}`);
            continue;
        }
        subtotal += price * item.quantity;
    }
    return parseFloat(subtotal.toFixed(2));
};

const calculateDiscount = (subtotal, couponData) => {

    if (!couponData) {
        return { discountAmount: 0, message: "لا توجد بيانات كوبون متوفرة." };
    }

    const now = new Date();
    if (!couponData.isActive || (couponData.expiresAt && now > couponData.expiresAt)) {
        return { discountAmount: 0, message: "الكوبون المطبق منتهي الصلاحية أو غير صالح." };
    }

    if (subtotal < couponData.minOrderAmount) {
        return { discountAmount: 0, message: `الحد الأدنى للطلب لهذا الكوبون هو ${couponData.minOrderAmount}₪.` };
    }

    let discount = 0;
    if (couponData.discountType === 'percentage') {
        discount = subtotal * (couponData.discountValue / 100);
        if (couponData.maxDiscountAmount !== null && discount > couponData.maxDiscountAmount) {
            discount = couponData.maxDiscountAmount;
        }
    } else if (couponData.discountType === 'fixed') {
        discount = couponData.discountValue;
    } else {
        return { discountAmount: 0, message: "نوع خصم الكوبون غير مدعوم." };
    }

    if (discount > subtotal) {
        discount = subtotal; 
    }

    return { discountAmount: parseFloat(discount.toFixed(2)), message: `تم تطبيق الكوبون '${couponData.code}'. الخصم: ${discount.toFixed(2)}₪.` };
};


const addUpdateCart = (req, res, next) => {

    const { productId, quantity, size } = req.body;
    const userId = req.user._id; 

    if (!productId || !quantity || quantity <= 0) {
        return returnJson(res, 400, false, "معرف المنتج وكمية صالحة مطلوبة.", null);
    }
    if (!userId) {
        return returnJson(res, 401, false, "غير مصرح به: معرف المستخدم مفقود.", null);
    }

    Cart.addOrUpdate(userId, productId, quantity, size, (result) => {
        if (result.status) {
            const status = result.message.includes("updated") ? 200 : 201;
            return returnJson(res, status, true, result.message, result.data);
        } else {
            return next(createError(500, result.message));
        }
    });
};


const getCartItems = (req, res, next) => {
    const userId = req.user._id;

    if (!userId) {
        return returnJson(res, 401, false, "غير مصرح به: معرف المستخدم مفقود من التوكن.", null);
    }

    Cart.list(userId, (cartItemsResult) => {

        if (!cartItemsResult.status) {
            return next(createError(500, cartItemsResult.message));
        }

        // لحساب المجموع الفرعي الخاص بالسلة
        const cartItems = cartItemsResult.data;
        const subtotal = calculateCartSubtotal(cartItems);

    
// ادا ما الو سلة هيتم انشاء الو سلة خاص فيه
        Cart.getUserCart(userId, (userCartResult) => {
            if (!userCartResult.status) {
                return next(createError(500, userCartResult.message));
            }

            const userCart = userCartResult.data;
           

            let finalDiscountAmount = 0;
            let finalCouponCode = null;
            let message = "تم جلب عناصر السلة بنجاح.";

            const previouslyAppliedCouponId = userCart.appliedCouponId;

            // console.log(`[getCartItems] previouslyAppliedCouponId: ${previouslyAppliedCouponId}`);

            //  يوجد كوبون مطبق مسبقا ع السلة هاي
            if (previouslyAppliedCouponId) {

                // console.log(`[getCartItems] Attempting to find coupon by ID: ${previouslyAppliedCouponId.toString()}`);

                Coupon.findById(previouslyAppliedCouponId.toString(), (couponFindResult) => {

                    if (couponFindResult.status) {
                        // جلب معلومات الكوبون
                        const couponData = couponFindResult.data;


                        // console.log(`[getCartItems] Coupon data found:`, couponData);

            

                        // بيحسب قيمة المبلغ الاجمالي وسعر الخصم وبيعطي الناتج النهائي
                        const { discountAmount: newDiscount, message: discountMsg } = calculateDiscount(subtotal, couponData);

                        // console.log(`[getCartItems] Calculated new discount: ${newDiscount}, Message: ${discountMsg}`);


                        // تم تطبيق الكوبون والخصم
                        if (newDiscount > 0) {
                            finalDiscountAmount = newDiscount;
                            finalCouponCode = couponData.code;
                            message = discountMsg;

                            // تحقق مما إذا كانت هناك حاجة لتحديث معلومات الكوبون في السلة (قد يكون السعر تغير مثلاً)
                            const needsUpdate = userCart.discountAmount !== finalDiscountAmount ||
                                                !userCart.appliedCouponCode ||
                                                !userCart.appliedCouponId.equals(couponData._id);



                            // console.log(`[getCartItems] Needs update? ${needsUpdate}`);

                            if (needsUpdate) {
                                console.log(`[getCartItems] Updating cart with new coupon info: ID=${couponData._id}, Code=${couponData.code}, Discount=${finalDiscountAmount}`);
                                Cart.updateCouponInfo(userId, couponData._id, couponData.code, finalDiscountAmount, (updateRes) => {
                                    if (!updateRes.status) {
                                        console.error("خطأ في تحديث خصم السلة:", updateRes.message);
                                    } else {
                                        console.log(`[getCartItems] Cart coupon info updated successfully.`);
                                    }
                                    sendCartResponse(res, cartItems, subtotal, finalDiscountAmount, finalCouponCode, message);
                                });
                            } else {
                                // console.log(`[getCartItems] No update needed, sending response.`);
                                sendCartResponse(res, cartItems, subtotal, finalDiscountAmount, finalCouponCode, message);
                            }


                        } else {
                            // الكوبون السابق لم يعد صالحًا (انتهت صلاحيته، الحد الأدنى للمبلغ لم يتحقق، إلخ)
                            console.log(`[getCartItems] Coupon no longer valid or doesn't provide discount. Resetting cart coupon info.`);

                            Cart.updateCouponInfo(userId, null, null, 0, (updateRes) => {
                                if (!updateRes.status) console.error("خطأ في مسح الكوبون غير الصالح من السلة:", updateRes.message);
                                sendCartResponse(res, cartItems, subtotal, 0, null, "الكوبون المطبق سابقًا لم يعد صالحًا أو الحد الأدنى للطلب لم يتحقق وتمت إزالته.");
                            });
                        }
                    } else {
                        // الكوبون المطبق سابقًا غير موجود أو تم حذفه
                        console.log(`[getCartItems] Previously applied coupon ID not found. Resetting cart coupon info.`);
                        Cart.updateCouponInfo(userId, null, null, 0, (updateRes) => {
                            if (!updateRes.status) console.error("خطأ في مسح الكوبون غير الصالح من السلة:", updateRes.message);
                            sendCartResponse(res, cartItems, subtotal, 0, null, "الكوبون المطبق سابقًا لم يعد صالحًا وتمت إزالته.");
                        });
                    }
                });
            } else {
                // لا يوجد كوبون مطبق مسبقًا
                console.log(`[getCartItems] No previously applied coupon ID found.`);
                sendCartResponse(res, cartItems, subtotal, 0, null, message);
            }
        });
    });
};


const sendCartResponse = (res, cartItems, subtotal, discountAmount, appliedCouponCode, message) => {
    const totalAfterDiscount = subtotal - discountAmount;
    return returnJson(res, 200, true, message, {
        cartItems: cartItems,
        appliedCouponCode: appliedCouponCode,
        totalDiscount: discountAmount,
        subtotal: subtotal,
        totalAfterDiscount: parseFloat(totalAfterDiscount.toFixed(2))
    });
};

// ممكن انو نستغى عنو بالمرحلة هاي 
// تحديث كمية عنصر في السلة
const updateCartItem = (req, res, next) => {
    const cartItemId = req.params.cartItemId;
    const { quantity } = req.body;
    const userId = req.user._id;

    if (!cartItemId || !quantity || quantity <= 0) {
        return returnJson(res, 400, false, "معرف عنصر السلة وكمية صالحة (يجب أن تكون > 0) مطلوبة.", null);
    }
    if (!userId) {
        return returnJson(res, 401, false, "غير مصرح به: معرف المستخدم مفقود.", null);
    }

    Cart.updateQuantityByIdAndUserId(cartItemId, userId, quantity, (result) => {
        if (result.status) {
            return returnJson(res, 200, true, "تم تحديث كمية عنصر السلة بنجاح. يرجى تحديث السلة لرؤية أي تغييرات في الخصم.", null);
        } else {
            const statusCode = result.message.includes("not found") || result.message.includes("unauthorized") ? 404 : 500;
            return next(createError(statusCode, result.message));
        }
    });
};

// حذف عنصر من السلة
const deleteCartItem = (req, res, next) => {
    const cartItemId = req.params.cartItemId;
    const userId = req.user._id;

    if (!cartItemId) {
        return returnJson(res, 400, false, "معرف عنصر السلة مطلوب.", null);
    }
    if (!userId) {
        return returnJson(res, 401, false, "غير مصرح به: معرف المستخدم مفقود.", null);
    }

    Cart.deleteByIdAndUserId(cartItemId, userId, (result) => {
        if (result.status) {
            // ملاحظة: قد تحتاج لجلب السلة مرة أخرى لتحديث الخصم بعد حذف العنصر
            return returnJson(res, 200, true, "تم حذف عنصر السلة بنجاح. يرجى تحديث السلة لرؤية أي تغييرات في الخصم.", null);
        } else {
            const statusCode = result.message.includes("not found") || result.message.includes("unauthorized") ? 404 : 500;
            return next(createError(statusCode, result.message));
        }
    });
};

// دالة تطبيق الكوبون على السلة فعلياً
const applyCouponToCart = (req, res, next) => {
    const { couponCode } = req.body;
    const userId = req.user._id;

    if (!couponCode) {
        return returnJson(res, 400, false, "الرجاء تقديم رمز كوبون.", null);
    }
    if (!userId) {
        return returnJson(res, 401, false, "غير مصرح به: معرف المستخدم مفقود.", null);
    }


    Cart.list(userId, (cartItemsResult) => {

        if (!cartItemsResult.status) {
            return next(createError(500, cartItemsResult.message));
        }

        const cartItems = cartItemsResult.data;
        const subtotal = calculateCartSubtotal(cartItems);

        if (subtotal === 0) {
            return returnJson(res, 400, false, "سلة التسوق الخاصة بك فارغة. أضف عناصر قبل تطبيق كوبون.", null);
        }

        Coupon.findByCode(couponCode, (couponResult) => {
            if (!couponResult.status) {
                return returnJson(res, 400, false, "رمز الكوبون غير صالح أو منتهي الصلاحية.", null);
            }

            const coupon = couponResult.data;
            const now = new Date();

            // التحققات الأساسية للكوبون
            if (!coupon.isActive || (coupon.expiresAt && now > coupon.expiresAt)) {
                return returnJson(res, 400, false, "رمز الكوبون غير صالح أو منتهي الصلاحية.", null);
            }
            if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
                return returnJson(res, 400, false, "وصل هذا الكوبون إلى حد استخدامه.", null);
            }

            const userObjectId = new ObjectId(userId);
            // جبت ع ال id الي مستفيدة من الكوبون
            const usersUsedIds = coupon.usersUsed.map(id => id.toString());

            // هذا التحقق يمنع المستخدم من استخدام كوبون "مرة واحدة لكل مستخدم" في *طلبات منفصلة*
            // المشكلة السابقة كانت في زيادة العداد عند كل "تطبيق" وليس "استخدام نهائي"
            if (usersUsedIds.includes(userObjectId.toString())) {
                return returnJson(res, 400, false, "لقد استخدمت هذا الكوبون بالفعل في طلب سابق.", null);
            }


            // جلب سلة المستخدم الحالية للتحقق من الكوبون المطبق مسبقًا
            Cart.getUserCart(userId, (userCartResult) => {

                if (!userCartResult.status) {
                    return next(createError(500, userCartResult.message));
                }
                const userCart = userCartResult.data;

                // إذا حاول المستخدم تطبيق نفس الكوبون المطبق بالفعل
                if (userCart.appliedCouponId && userCart.appliedCouponId.equals(coupon._id)) {
                    const { discountAmount: newDiscount, message: message } = calculateDiscount(subtotal, coupon);
                    if (newDiscount > 0) {
                        Cart.updateCouponInfo(userId, coupon._id, coupon.code, newDiscount, (updateCartRes) => {
                            if (!updateCartRes.status) console.error("خطأ في إعادة تحديث خصم السلة:", updateCartRes.message);
                            sendCartResponse(res, cartItems, subtotal, newDiscount, coupon.code, "الكوبون مطبق بالفعل وتمت إعادة تقييمه.");
                        });
                        return;
                    } else {
                        // الكوبون كان مطبقًا ولكنه لم يعد صالحًا الآن (مثل تغير الحد الأدنى للمبلغ)
                        Cart.updateCouponInfo(userId, null, null, 0, (updateCartRes) => {
                            if (!updateCartRes.status) console.error("خطأ في مسح الكوبون غير الصالح عند إعادة التطبيق:", updateCartRes.message);
                            return returnJson(res, 400, false, "الكوبون المطبق سابقًا لم يعد صالحًا أو الحد الأدنى للطلب لم يتحقق وتمت إزالته.", null);
                        });
                        return;
                    }
                }



                // حساب الخصم
                const { discountAmount, message } = calculateDiscount(subtotal, coupon);

                // فيه خطا بالكود هاد
                if (discountAmount === 0 && message.includes("Minimum order amount")) {
                    return returnJson(res, 400, false, message, null);
                } else if (discountAmount === 0) {
                    return returnJson(res, 400, false, "تعذر تطبيق الكوبون في هذا الوقت. " + message, null);
                }

                // تحديث وثيقة السلة الرئيسية بمعلومات الكوبون والخصم
                Cart.updateCouponInfo(userId, coupon._id, coupon.code, discountAmount, (updateCartResult) => {
                    if (updateCartResult.status) {
                
                        // إعادة جلب السلة بالكامل بعد تطبيق الكوبون وتحديثها في الـ frontend
                        Cart.list(userId, (finalCartItemsResult) => {
                            if (!finalCartItemsResult.status) {
                                return next(createError(500, finalCartItemsResult.message));
                            }
                            const finalCartItems = finalCartItemsResult.data;
                            const finalSubtotal = calculateCartSubtotal(finalCartItems);

                            // نحتاج لجلب وثيقة السلة مرة أخرى للحصول على أحدث تفاصيل الكوبون
                            // بعد تحديثها بواسطة updateCouponInfo
                            Cart.getUserCart(userId, (finalUserCartResult) => {
                                if (!finalUserCartResult.status) {
                                    return next(createError(500, finalUserCartResult.message));
                                }
                                const finalUserCart = finalUserCartResult.data;
                                sendCartResponse(res, finalCartItems, finalSubtotal, finalUserCart.discountAmount, finalUserCart.appliedCouponCode, message);
                            });
                        });
                    } else {
                        return next(createError(500, updateCartResult.message));
                    }
                });
            });
        });
    });
};

const checkout = (req, res, next) => {
    const userId = req.user._id;

    if (!userId) {
        return returnJson(res, 401, false, "غير مصرح به: معرف المستخدم مفقود.", null);
    }

    // الخطوة 1: جلب سلة المستخدم للتحقق من الكوبون
    Cart.getUserCart(userId, (userCartResult) => {
        if (!userCartResult.status) {
            return next(createError(500, userCartResult.message));
        }
        const userCart = userCartResult.data;
        const previouslyAppliedCouponId = userCart.appliedCouponId;
        const couponCode = userCart.appliedCouponCode;

        // الخطوة 2: تحديث الكوبون (إذا كان هناك كوبون مطبق)
        // يجب أن يتم هذا فقط عند إتمام عملية الشراء وليس عند كل تطبيق للكوبون
        if (previouslyAppliedCouponId && couponCode) {
            Coupon.incrementUsage(previouslyAppliedCouponId.toString(), userId, (updateResult) => {
                if (!updateResult.status) {
                    console.error("خطأ في تحديث استخدام الكوبون:", updateResult.message);
                    // لا توقف العملية إذا فشل تحديث الكوبون، لأن إفراغ السلة أهم
                }
                // بعد تحديث الكوبون، ننتقل لإفراغ السلة
                emptyTheCart(userId, res, next, couponCode);
            });
        } else {
            // لا يوجد كوبون، ننتقل مباشرة لإفراغ السلة
            emptyTheCart(userId, res, next, null);
        }
    });
};


// دالة مساعدة لتقليل التكرار
const emptyTheCart = (userId, res, next, couponCode) => {
    // الخطوة 3: إفراغ سلة المستخدم
    Cart.emptyCart(userId, (emptyCartResult) => {
        if (!emptyCartResult.status) {
            return next(createError(500, emptyCartResult.message));
        }

        // الخطوة 4: مسح معلومات الكوبون من وثيقة السلة الرئيسية
        Cart.updateCouponInfo(userId, null, null, 0, (updateCartResult) => {
            if (!updateCartResult.status) {
                console.error("خطأ في مسح معلومات الكوبون من السلة:", updateCartResult.message);
                // لا توقف العملية، فهي ليست حرجة
            }
            
            // الخطوة 5: إرسال الرد النهائي
            let successMessage = "تم إتمام عملية الشراء بنجاح! سلة التسوق فارغة الآن.";
            if (couponCode) {
                successMessage += ` وتم تسجيل استخدام الكوبون '${couponCode}'.`;
            }

            return returnJson(res, 200, true, successMessage, null);
        });
    });
};

module.exports = {
    addUpdateCart,
    getCartItems,
    updateCartItem,
    deleteCartItem,
    applyCouponToCart,
    checkout 
};
