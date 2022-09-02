const express = require('express');
const authController = require('../controllers/authController');
const tagController = require('../controllers/tagController');

const router = express.Router();

router.use(authController.protect);

router.route('/').post(tagController.createTag).get(tagController.getAllTags);
router
  .route('/:id')
  .get(tagController.getTag)
  .put(tagController.updateTag)
  .delete(tagController.deleteTag);

module.exports = router;
