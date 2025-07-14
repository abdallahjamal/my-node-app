const { Router } = require('express');
const { favoriteController } = require('../controllers');
const auth = require('../middleware/auth'); 

const router = Router();

router.post('/', auth, favoriteController.addFavorite); 

// router.get('/:userId', favoriteController.getFavoriteItems);
router.get('/', auth, favoriteController.getFavoriteItems);

// router.delete('/:userId/:productId', auth, favoriteController.deleteFavorite);

router.delete('/:productId', auth, favoriteController.deleteFavorite); // <--- تم التعديل هنا

module.exports = router;