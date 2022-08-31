const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/signin', authController.signin);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

router.use(authController.protect);
router
  .route('/user')
  .get(userController.getUser)
  .put(userController.updateUser)
  .delete(userController.deleteUser);
// router.route('/test').get(authController.protect, (req, res) => {
//   return res.status(200).json({
//     message: 'succesfull',
//   });
// });

module.exports = router;
