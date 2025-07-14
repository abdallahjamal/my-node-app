const { Favorite } = require('../models'); 
const createError = require('http-errors');
const { returnJson } = require('../my_modules/json_response'); 

// إضافة منتج إلى المفضلة
const addFavorite = (req, res, next) => {
    const { productId } = req.body;
    const userId = req.user._id; 
    if (!productId) {
        return returnJson(res, 400, false, "Product ID is required.", null);
    }
    if (!userId) {
        return returnJson(res, 401, false, "Unauthorized: User ID missing.", null);
    }

    const favorite = new Favorite({ userId, productId });

    favorite.isProductFavorite(userId, productId)
        .then((exists) => {
            if (exists) {
                return returnJson(res, 409, false, "Product already in favorites", null);
            }

            favorite.save((result) => {
                if (result.status) {
                    return returnJson(res, 201, true, "Product added to favorites", result.data);
                } else {
                    return next(createError(500, result.message));
                }
            });
        })
        .catch(err => next(createError(500, err.message)));
};



// جلب المنتجات المفضلة لمستخدم (تم التعديل)
const getFavoriteItems = (req, res, next) => {
        const userId = req.user._id; 

    if (!userId) {
        return returnJson(res, 401, false, "Unauthorized: User ID missing from token.", null);
    }

    Favorite.list(userId, (result) => {
        if (result.status) {
            return returnJson(res, 200, true, "Favorite items fetched", result.data);
        } else {
            return next(createError(500, result.message));
        }
    });
};

// حذف منتج من المفضلة (تم التعديل)
const deleteFavorite = (req, res, next) => {
    const productId = req.params.productId; 
    const userId = req.user._id;         

    if (!productId) { 
        return returnJson(res, 400, false, "Product ID is required.", null);
    }


    Favorite.delete(userId, productId, (result) => {
        if (result.status) {
            return returnJson(res, 200, true, "Product removed from favorites", null);
        } else {
            const statusCode = result.message.includes("not found") ? 404 : 500;
            return next(createError(statusCode, result.message));
        }
    });
};
module.exports = {
    addFavorite,
    getFavoriteItems,
    deleteFavorite
};