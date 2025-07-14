const { Router } = require('express');
const { productController } = require('../controllers');
const auth = require('../middleware/auth');

const router = Router();

router.post('/', auth, productController.addProduct);
router.get('/', productController.getProducts);
router.get('/:id',  productController.getProductsByCategory);
router.get('/product/:id',  productController.getProductById);
router.put('/:id', auth, productController.updateProduct);
router.delete('/:id', auth, productController.deleteProduct);

module.exports = router;
