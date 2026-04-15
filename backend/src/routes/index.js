const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const txnController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/auth');

// ---- Auth Routes (public) ----
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// ---- Transaction Routes (protected) ----
router.post('/add-entry', authMiddleware, txnController.addEntry);
router.post('/add-payment', authMiddleware, txnController.addPayment);
router.post('/add-payment/confirm', authMiddleware, txnController.confirmPayment);
router.get('/transactions/:dlNumber', authMiddleware, txnController.getTransactions);
router.get('/summary/:dlNumber', authMiddleware, txnController.getSummary);

module.exports = router;
