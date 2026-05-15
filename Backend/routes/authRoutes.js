const express = require('express');
const router = express.Router();
const { registerUser, loginUser, refreshToken, logoutUser, forgotPassword, resetPassword, changePassword, updateProfile, getProfile } = require('../controller/authController');
const verifyJWT = require('../middleware/verifyJWT');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/refresh', refreshToken);
router.post('/logout', logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', verifyJWT, changePassword);
router.put('/update-profile', verifyJWT, updateProfile);
router.get('/get-profile', verifyJWT, getProfile);

module.exports = router;
