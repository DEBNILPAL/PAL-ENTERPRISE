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

// PUT /api/edit-entry/:id — Edit an existing bill entry
async function editEntry(req, res) {
  try {
    const { dlNumber } = req.user;
    const { id } = req.params;
    const { date, billNo, amount, returnGoods, expGoods } = req.body;

    if (!date || !billNo || amount === undefined) {
      return res.status(400).json({ error: 'Date, Bill Number, and Amount are required.' });
    }

    // Find the existing transaction
    const existing = jsonDb.getTransactionsByDL(dlNumber);
    const txn = existing.find(t => t.id === id && t.type === 'bill');
    if (!txn) {
      return res.status(404).json({ error: 'Bill not found.' });
    }

    // Check for duplicate bill number (if billNo changed)
    if (billNo !== txn.billNo) {
      const duplicate = existing.find(t => t.type === 'bill' && t.billNo === billNo && t.id !== id);
      if (duplicate) {
        return res.status(409).json({ error: `Bill number "${billNo}" already exists.` });
      }
    }

    const oldBillNo = txn.billNo;

    // Update in JSON db
    const updates = {
      date,
      billNo: billNo.trim(),
      amount: parseFloat(amount) || 0,
      returnGoods: returnGoods || '',
      expGoods: expGoods || '',
    };
    const updated = jsonDb.updateTransaction(id, dlNumber, updates);

    if (!updated) {
      return res.status(500).json({ error: 'Failed to update bill.' });
    }

    // If bill number changed, update all payments targeting this bill
    if (billNo !== oldBillNo) {
      const allTxns = jsonDb.getTransactionsByDL(dlNumber);
      allTxns.filter(t => t.type === 'payment' && t.targetBillNo === oldBillNo).forEach(t => {
        jsonDb.updateTransaction(t.id, dlNumber, { targetBillNo: billNo.trim() });
      });
    }

    // Dual-write to PG
    await pgDb.pgUpdateTransaction(id, { ...updates, dlNumber, oldBillNo });

    const summary = jsonDb.getSummary(dlNumber);

    return res.json({
      message: 'Bill updated successfully.',
      transaction: updated,
      summary,
    });
  } catch (err) {
    console.error('[Txn] Edit entry error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// POST /api/admin/reports — Get all users' reports (password protected)
async function getAllReports(req, res) {
  try {
    const { password, dateFrom, dateTo } = req.body;

    if (password !== 'sudip@1971') {
      return res.status(403).json({ error: 'Invalid admin password.' });
    }

    const users = jsonDb.getAllUsers();
    const reports = users.map(u => {
      let txns = jsonDb.getTransactionsByDL(u.dlNumber);

      // Filter by date range if provided
      if (dateFrom) {
        txns = txns.filter(t => t.date >= dateFrom);
      }
      if (dateTo) {
        txns = txns.filter(t => t.date <= dateTo);
      }

      let totalBillAmount = 0;
      let totalPayment = 0;
      txns.forEach(t => {
        totalBillAmount += parseFloat(t.amount) || 0;
        totalPayment += parseFloat(t.payment) || 0;
      });

      const billwise = jsonDb.getBillWiseSummary(u.dlNumber);
      // Filter billwise by date too
      let filteredBillwise = billwise;
      if (dateFrom || dateTo) {
        filteredBillwise = billwise.filter(b => {
          let match = true;
          if (dateFrom) match = match && b.date >= dateFrom;
          if (dateTo) match = match && b.date <= dateTo;
          return match;
        });
      }

      return {
        shopName: u.shopName,
        dlNumber: u.dlNumber,
        address: u.address || '',
        phone: u.phone || '',
        doctorName: u.doctorName || '',
        ledgerFolio: u.ledgerFolio || '',
        totalBillAmount: Math.round(totalBillAmount * 100) / 100,
        totalPayment: Math.round(totalPayment * 100) / 100,
        remainingBalance: Math.round((totalBillAmount - totalPayment) * 100) / 100,
        billwise: filteredBillwise,
        transactionCount: txns.length,
      };
    });

    return res.json({ reports });
  } catch (err) {
    console.error('[Txn] Get all reports error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { addEntry, addPayment, confirmPayment, getTransactions, getSummary, editEntry, getAllReports };
