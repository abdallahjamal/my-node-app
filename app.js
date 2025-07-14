

const express = require('express')
const createError = require('http-errors')

const middleware = require('./middleware')
const routes = require('./routes')

// معرف ع مستوى المشروعع
const {returnJson} = require('./my_modules/json_response')
global.returnJson = returnJson

const app = express();


// بمسك اي ايرور مش معمول الو catch
process.on('unhandledRejection', (reason) =>{
    console.log(reason)
    process.exit(1)
})


/**
 * Middlewares
 */
middleware.global(app);


/**
 * Routes
 */
routes(app);



/**
 * Not Found Handler
 */

app.use((req, res, next) => {
    const error = createError(404);
    next(error)
})

/**
 * Error handle
 */
// app.use((error, req, res, next) => {
//  return returnJson(res,error.statusCode,false,error.messag,null)
// })

app.use((error, req, res, next) => {
return returnJson(res, error.statusCode || 500, false, error.message || "Unknown error", null)
})



module.exports = app