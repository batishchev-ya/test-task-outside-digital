const express = require('express');
const authController = require('../controllers/authController');
const userTagsController = require('../controllers/userTagsController');

const router = express.Router();

router.use(authController.protect);

router.route('/').post(userTagsController.createUserTags);
router.route('/my').get(userTagsController.getMyTags);
router.route('/:id').delete(userTagsController.deleteUserTags);

module.exports = router;
