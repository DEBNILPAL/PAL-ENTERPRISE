const jsonDb = require('../database/jsonDb');
const pgDb = require('../database/pgDb');

// POST /api/add-entry  — Add a new bill entry
async function addEntry(req, res) {
  try {
    const { dlNumber } = req.user; // from JWT
    const { date, billNo, amount, signature, returnGoods, expGoods } = req.body;

    if (!date || !billNo || amount === undefined) {
      return res.status(400).json({ error: 'Date, Bill Number, and Amount are required.' });
    }

    // Check for duplicate bill number for this user
    const existing = jsonDb.getTransactionsByDL(dlNumber);
    const duplicate = existing.find((t) => t.type === 'bill' && t.billNo === billNo);
    if (duplicate) {
      return res.status(409).json({ error: `Bill number "${billNo}" already exists.` });
    }

    const entry = jsonDb.addTransaction({
      dlNumber,
      date,
      billNo,
      amount: parseFloat(amount) || 0,
      payment: 0,
      paymentDate: '',
      returnGoods: returnGoods || '',
      expGoods: expGoods || '',
      signature: signature || '',
      type: 'bill',
      targetBillNo: '',
    });

    // Dual-write
    await pgDb.pgAddTransaction(entry);

    const summary = jsonDb.getSummary(dlNumber);

    return res.status(201).json({
      message: 'Bill entry added successfully.',
      transaction: entry,
      summary,
    });
  } catch (err) {
    console.error('[Txn] Add entry error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// POST /api/add-payment  — Add a payment entry against a specific bill
async function addPayment(req, res) {
  try {
    const { dlNumber } = req.user;
    const { payment, paymentDate, signature, targetBillNo } = req.body;

    if (!payment || !paymentDate) {
      return res.status(400).json({ error: 'Payment amount and Payment Date are required.' });
    }

    if (!targetBillNo) {
      return res.status(400).json({ error: 'Please select a bill to pay against.' });
    }

    const paymentAmount = parseFloat(payment) || 0;

    // Get bill-wise summary to check this specific bill's due
    const billwise = jsonDb.getBillWiseSummary(dlNumber);
    const targetBill = billwise.find((b) => b.billNo === targetBillNo);

    if (!targetBill) {
      return res.status(404).json({ error: `Bill "${targetBillNo}" not found.` });
    }

    // Check if payment exceeds this bill's remaining due
    if (paymentAmount > targetBill.due && targetBill.due > 0) {
      return res.status(200).json({
        warning: `Payment of ₹${paymentAmount} exceeds remaining due of ₹${targetBill.due} for Bill ${targetBillNo}.`,
        allowOverpay: true,
        billDue: targetBill.due,
      });
    }

    const entry = jsonDb.addTransaction({
      dlNumber,
      date: paymentDate,
      billNo: '',
      amount: 0,
      payment: paymentAmount,
      paymentDate,
      returnGoods: '',
      expGoods: '',
      signature: signature || '',
      type: 'payment',
      targetBillNo: targetBillNo,
    });

    await pgDb.pgAddTransaction(entry);

    const summary = jsonDb.getSummary(dlNumber);

    return res.status(201).json({
      message: `Payment of ₹${paymentAmount} recorded against Bill ${targetBillNo}.`,
      transaction: entry,
      summary,
    });
  } catch (err) {
    console.error('[Txn] Add payment error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// POST /api/add-payment/confirm  — Confirm overpayment
async function confirmPayment(req, res) {
  try {
    const { dlNumber } = req.user;
    const { payment, paymentDate, signature, targetBillNo } = req.body;

    const paymentAmount = parseFloat(payment) || 0;

    const entry = jsonDb.addTransaction({
      dlNumber,
      date: paymentDate,
      billNo: '',
      amount: 0,
      payment: paymentAmount,
      paymentDate,
      returnGoods: '',
      expGoods: '',
      signature: signature || '',
      type: 'payment',
      targetBillNo: targetBillNo || '',
    });

    await pgDb.pgAddTransaction(entry);
    const summary = jsonDb.getSummary(dlNumber);

    return res.status(201).json({
      message: 'Payment recorded successfully (overpayment confirmed).',
      transaction: entry,
      summary,
    });
  } catch (err) {
    console.error('[Txn] Confirm payment error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// GET /api/transactions/:dlNumber
function getTransactions(req, res) {
  try {
    const requestedDL = req.params.dlNumber;
    const { dlNumber: authedDL } = req.user;

    // Data isolation: user can only see their own data
    if (requestedDL !== authedDL) {
      return res.status(403).json({ error: 'Access denied. You can only view your own transactions.' });
    }

    const transactions = jsonDb.getTransactionsByDL(requestedDL);
    const billwise = jsonDb.getBillWiseSummary(requestedDL);

    return res.json({ transactions, billwise });
  } catch (err) {
    console.error('[Txn] Get transactions error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// GET /api/summary/:dlNumber
function getSummary(req, res) {
  try {
    const requestedDL = req.params.dlNumber;
    const { dlNumber: authedDL } = req.user;

    if (requestedDL !== authedDL) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const summary = jsonDb.getSummary(requestedDL);
    const billwise = jsonDb.getBillWiseSummary(requestedDL);

    return res.json({ summary, billwise });
  } catch (err) {
    console.error('[Txn] Get summary error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { addEntry, addPayment, confirmPayment, getTransactions, getSummary };
