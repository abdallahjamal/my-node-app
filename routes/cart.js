
const { Router } = require('express');
const { cartController } = require('../controllers');
const auth = require('../middleware/auth');

const router = Router();

router.use(auth); 

router.post('/', cartController.addUpdateCart);
router.get('/', cartController.getCartItems); 
router.put('/:cartItemId', cartController.updateCartItem);
router.delete('/:cartItemId', cartController.deleteCartItem);
router.post('/apply-coupon', cartController.applyCouponToCart);

module.exports = router;