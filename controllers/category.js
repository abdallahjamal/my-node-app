const { Category } = require('../models');
const createError = require('http-errors');
const { returnJson } = require('../my_modules/json_response');


const addCategory = (req, res, next) => {
    const category = new Category(req.body);

    category.isExist()
        .then((exists) => {
            if (exists) {
                return returnJson(res, 409, false, "Category already exists", null);
            }

            category.save((result) => {
                if (result.status) {
                    return returnJson(res, 201, true, "Category created", null);
                } else {
                    return next(createError(500, result.message));
                }
            });
        })
        .catch(err => next(createError(500, err.message)));
};

const updateCategory = (req, res, next) => {
    const id = req.params.id;
    const data = req.body;

    Category.update(id, data, (result) => {
        if (result.status) {
            return returnJson(res, 200, true, "Category updated", null);
        } else {
            return next(createError(500, result.message));
        }
    });
};

const deleteCategory = (req, res, next) => {
    const id = req.params.id;

    Category.delete(id, (result) => {
        if (result.status) {
            return returnJson(res, 200, true, "Category deleted", null);
        } else {
            return next(createError(500, result.message));
        }
    });
};



const getCategories = (req, res, next) => {
    Category.list((result) => {
        if (result.status) {
            return returnJson(res, 200, true, "Categories fetched", result.data);
        } else {
            return next(createError(500, result.message));
        }
    });
};

module.exports = {
    addCategory,
    getCategories,
    updateCategory,
    deleteCategory
};
