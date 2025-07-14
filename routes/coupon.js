const { Router } = require('express');
const { couponController } = require('../controllers');
const auth = require('../middleware/auth'); 



const router = Router();

router.post('/', auth, couponController.createCoupon);
router.get('/', auth,  couponController.getCoupons);
router.get('/:id', auth, couponController.getCoupon);
router.put('/:id', auth,  couponController.updateCoupon);
router.delete('/:id', auth,  couponController.deleteCoupon);

module.exports = router;