const authRouter = require('./auth')
const categoriesRouter = require('./categories')
const productsRouter = require('./products')
const cartRouter = require('./cart')
const favoriteRouter = require('./favorite')
const couponRouter = require('./coupon')





module.exports = (app) =>{

    app.get('/',(req,res,next) => {
        res.status(200).json({
            status: true,
            message: null
        })
    })

    app.use('/auth',authRouter)
    app.use('/api/store/categories',categoriesRouter)
    app.use('/api/store/products',productsRouter)
     app.use('/api/store/cart',cartRouter)
    app.use('/api/store/favorite',favoriteRouter)
    app.use('/api/store/coupon',couponRouter)
    
}