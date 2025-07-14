
const {Router} = require('express')
const {authController} = require('../controllers')
const auth = require('../middleware/auth');




const router = Router()

router.post('/signup',authController.signup)
.post('/login',authController.login)

router.post('/logout', auth ,authController.logout);
router.put('/profile', auth, authController.updateProfile);


module.exports = router