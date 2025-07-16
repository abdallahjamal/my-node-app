
const { User , TokenBlacklist} = require('../models');
const createError = require('http-errors');
const jwt = require('jsonwebtoken');
const { readFileSync } = require('fs');
const { returnJson } = require('../my_modules/json_response');



/**
 * انشاء الحساب
 */

const signup = (req, res, next) => {
    const userData = req.body;

    const validation = User.validate(userData);
    if (validation.error) {
        return returnJson(res, 400, false, validation.error.message, null);
    }

    const user = new User(userData);
    user.isExist()
        .then(result => {
            if (result.check) {
                return returnJson(res, 409, false, result.message, null);
            }

         
            user.save((status) => {
                if (status.status) {
                    return returnJson(res, 201, true, "User created successfully", null);
                } else {
                    return next(createError(500, status.message));
                }
            });
        })
        .catch(err => {
            return next(createError(500, err.message));
        });
};


/**
 * تسجيل الدخول
 */

const login = async (req, res, next) => {
    try {
        const result = await User.login(req.body);

        if (!result.status) {
            return returnJson(res, result.code || 401, false, result.message || 'Invalid login data', null);
        }

      
        const jwtSecretKey = readFileSync('./configurations/private.key');
        const token = jwt.sign(
            { _id: result.data._id },
            jwtSecretKey,
          
        );

      
        return returnJson(res, 200, true, "Login Successfully", {
            token,
            user: {
                name: result.data.name,
                email: result.data.email,
                username: result.data.username,
                profilePictureUrl: result.data.profilePictureUrl,
                phone : result.data.phone,
                address : result.data.address
            }
        });

    } catch (err) {
        return next(createError(500, err.message));
    }
};


/**
 * تسجيل الخروج
 */

const logout = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return returnJson(res, 400, false, "No token provided", null);
    }

    try {
        await TokenBlacklist.add(token);
        return returnJson(res, 200, true, "Logged out successfully", null);
    } catch (err) {
        return returnJson(res, 500, false, err.message, null);
    }
};

const updateProfile = async (req, res, next) => {
  

    const userId = req.user._id;
    const updateData = req.body;

    try {
        const result = await User.updateUser(userId, updateData);

        if (!result.status) {
            return returnJson(res, result.code || 400, false, result.message, null);
        }

        return returnJson(res, 200, true, result.message, {
            user: {
                _id: result.data._id,
                name: result.data.name,
                email: result.data.email,
                username: result.data.username,
                profilePictureUrl: result.data.profilePictureUrl || null,
                phone : result.data.phone || null,
                address : result.data.address || null
            }
        });

    } catch (err) {
        return next(createError(500, err.message));
    }
};

module.exports = {
    signup,
    login,
    logout,
    updateProfile
};
