const { Product } = require('../models');
const createError = require('http-errors');
const { returnJson } = require('../my_modules/json_response');

const addProduct = (req, res, next) => {
    const product = new Product(req.body);

    product.isExist()
        .then((exists) => {
            if (exists) {
                return returnJson(res, 409, false, "Product already exists", null);
            }

            product.save((result) => {
                if (result.status) {
                    return returnJson(res, 201, true, "Product created", null);
                } else {
                    return next(createError(500, result.message));
                }
            });
        })
        .catch(err => next(createError(500, err.message)));
};

const updateProduct = (req, res, next) => {
    const id = req.params.id;
    const data = req.body;

    Product.update(id, data, (result) => {
        if (result.status) {
            return returnJson(res, 200, true, "Product updated", null);
        } else {
            return next(createError(500, result.message));
        }
    });
};

const deleteProduct = (req, res, next) => {
    const id = req.params.id;

    Product.delete(id, (result) => {
        if (result.status) {
            return returnJson(res, 200, true, "Product deleted", null);
        } else {
            return next(createError(500, result.message));
        }
    });
};

const getProducts = (req, res, next) => {
    Product.listAll((result) => {
        if (result.status) {
            return returnJson(res, 200, true, "All products fetched", result.data);
        } else {
            return next(createError(500, result.message));
        }
    });
};

const getProductsByCategory = (req, res, next) => {
    const categoryId = req.params.id;

    Product.listByCategory(categoryId, (result) => {
        if (result.status) {
            return returnJson(res, 200, true, "Products fetched by category", result.data);
        } else {
            return next(createError(500, result.message));
        }
    });
};

const getProductById = (req, res, next) => {
    const productId = req.params.id;

    Product.getProductById(productId, (result) => {
        if (result.status) {
            return returnJson(res, 200, true, "Products fetched by ID", result.data);
        } else {
            return next(createError(500, result.message));
        }
    });
};

module.exports = {
    addProduct,
    getProducts,
    getProductsByCategory,
    getProductById,
    deleteProduct,
    updateProduct
};
