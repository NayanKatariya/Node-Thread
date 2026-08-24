var express = require('express');
var router = express.Router();
const { login, adminRegister, googleSignUp, googleSignIn, sendVerificationCode, verifyCode, resendVerificationCode } = require('../controllers/user.controller');
const { registerValidation, loginValidation, googleSignUpValidation, sendVerificationCodeValidation, verifyCodeValidation, reSendCodeValidation } = require('../validations/user.validation');

router.post('/adminRegister',registerValidation, adminRegister);
router.post('/login', loginValidation,login);
router.post('/google-signup',googleSignUpValidation,googleSignUp);
router.post('/google-signin',googleSignUpValidation,googleSignIn);
router.post('/send-verification-code',sendVerificationCodeValidation,sendVerificationCode);
router.post( "/verify-code", verifyCodeValidation, verifyCode );
router.post( "/resend-code", reSendCodeValidation, resendVerificationCode );
module.exports = router;
