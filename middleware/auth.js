const jwt = require('jsonwebtoken')
const {readFileSync} = require('fs')
const {TokenBlacklist} = require('../models');




module.exports = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return returnJson(res, 401, false, "Unauthorized - token not found", null);
    }

    try {
        const privateKey = readFileSync('./configurations/private.key');
        const decoded = jwt.verify(token, privateKey);

        const isBlacklisted = await TokenBlacklist.isBlacklisted(token);
        if (isBlacklisted) {
            return returnJson(res, 401, false, "Token is blacklisted", null);
        }

        req.user = decoded;
        next();
    } catch (err) {
        return returnJson(res, 401, false, "Invalid token", null);
    }
};

