const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const txnController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/auth');

// ---- Auth Routes (public) ----
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// ---- Admin Routes (password-protected, no JWT) ----
router.post('/admin/reports', txnController.getAllReports);

// ---- Transaction Routes (protected) ----
router.post('/add-entry', authMiddleware, txnController.addEntry);
router.put('/edit-entry/:id', authMiddleware, txnController.editEntry);
router.post('/add-payment', authMiddleware, txnController.addPayment);
router.post('/add-payment/confirm', authMiddleware, txnController.confirmPayment);
router.get('/transactions/:dlNumber', authMiddleware, txnController.getTransactions);
router.get('/summary/:dlNumber', authMiddleware, txnController.getSummary);

// ---- Profile Routes (protected) ----
router.delete('/delete-profile/:dlNumber', authMiddleware, authController.deleteProfile);

module.exports = router;
