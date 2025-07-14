const { Router } = require('express');
const { categoryController } = require('../controllers');
const auth = require('../middleware/auth');

const router = Router();

router.post('/', auth, categoryController.addCategory);
router.get('/', categoryController.getCategories);
router.put('/:id', auth, categoryController.updateCategory);
router.delete('/:id', auth, categoryController.deleteCategory);

module.exports = router;
