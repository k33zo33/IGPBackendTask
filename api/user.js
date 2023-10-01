const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); 

// Define your API routes and use the controller functions

router.post('/signup', userController.registerUser);
router.get('/verify/:userId/:uniqueString', userController.verifyEmail);
router.post('/signin', userController.signInUser);
router.get('/signout', userController.signOutUser);

module.exports = router;