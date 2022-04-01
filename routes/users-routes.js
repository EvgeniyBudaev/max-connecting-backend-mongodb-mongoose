const express = require('express');
const { check } = require('express-validator');
const usersController = require('../controllers/users-controllers');

const router = express.Router();

router.get('/', usersController.getUsers);

router.post('/signup', [
	check('name', 'Name is required').not().isEmpty(),
	check('email', 'Please include a valid email').normalizeEmail().isEmail(),
	check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], usersController.signup);

router.post('/login', usersController.login);

module.exports = router;
