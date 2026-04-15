const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');

// Ensure data directory and files exist
function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(TRANSACTIONS_FILE)) {
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify([], null, 2));
  }
}

ensureDataFiles();

// ---------- READ / WRITE helpers ----------

function readJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ---------- USER operations ----------

function getAllUsers() {
  return readJSON(USERS_FILE);
}

function getUserByDL(dlNumber) {
  const users = getAllUsers();
  return users.find((u) => u.dlNumber === dlNumber) || null;
}

function getUserByShopName(shopName) {
  const users = getAllUsers();
  return users.find((u) => u.shopName.toLowerCase() === shopName.toLowerCase()) || null;
}

function getUserByDoctorName(doctorName) {
  const users = getAllUsers();
  return users.find((u) => u.doctorName && u.doctorName.toLowerCase() === doctorName.toLowerCase()) || null;
}

function getUsersByShopName(shopName) {
  const users = getAllUsers();
  return users.filter((u) => u.shopName.toLowerCase() === shopName.toLowerCase());
}

function getUsersByDoctorName(doctorName) {
  const users = getAllUsers();
  return users.filter((u) => u.doctorName && u.doctorName.toLowerCase() === doctorName.toLowerCase());
}

function deleteUser(dlNumber) {
  let users = getAllUsers();
  users = users.filter(u => u.dlNumber !== dlNumber);
  writeJSON(USERS_FILE, users);
}

function createUser(user) {
  const users = getAllUsers();
  // Ensure unique DL number
  if (users.find((u) => u.dlNumber === user.dlNumber)) {
    return { error: 'DL Number already registered' };
  }
  const newUser = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    shopName: user.shopName,
    address: user.address,
    dlNumber: user.dlNumber,
    ledgerFolio: user.ledgerFolio,
    phone: user.phone,
    doctorName: user.doctorName || '',
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  writeJSON(USERS_FILE, users);
  return { user: newUser };
}

// ---------- TRANSACTION operations ----------

function getTransactionsByDL(dlNumber) {
  const all = readJSON(TRANSACTIONS_FILE);
  return all.filter((t) => t.dlNumber === dlNumber);
}

function addTransaction(entry) {
  const all = readJSON(TRANSACTIONS_FILE);
  const newEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    dlNumber: entry.dlNumber,
    date: entry.date,
    billNo: entry.billNo || '',
    amount: parseFloat(entry.amount) || 0,
    payment: parseFloat(entry.payment) || 0,
    paymentDate: entry.paymentDate || '',
    returnGoods: entry.returnGoods || '',
    expGoods: entry.expGoods || '',
    signature: entry.signature || '',
    type: entry.type || 'bill', // 'bill' or 'payment'
    targetBillNo: entry.targetBillNo || '', // which bill this payment is for
    createdAt: new Date().toISOString(),
  };
  all.push(newEntry);
  writeJSON(TRANSACTIONS_FILE, all);
  return newEntry;
}

function getSummary(dlNumber) {
  const txns = getTransactionsByDL(dlNumber);
  let totalBillAmount = 0;
  let totalPayment = 0;
  txns.forEach((t) => {
    totalBillAmount += parseFloat(t.amount) || 0;
    totalPayment += parseFloat(t.payment) || 0;
  });
  return {
    totalBillAmount: Math.round(totalBillAmount * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    remainingBalance: Math.round((totalBillAmount - totalPayment) * 100) / 100,
    transactionCount: txns.length,
  };
}

// Get bill-wise breakdown
function getBillWiseSummary(dlNumber) {
  const txns = getTransactionsByDL(dlNumber);
  const bills = {};

  // First pass: collect all bills
  txns.filter((t) => t.type === 'bill').forEach((t) => {
    bills[t.billNo] = {
      billNo: t.billNo,
      date: t.date,
      amount: parseFloat(t.amount) || 0,
      totalPaid: 0,
      due: parseFloat(t.amount) || 0,
      payments: [],
    };
  });

  // Second pass: assign payments to their target bills
  txns.filter((t) => t.type === 'payment').forEach((t) => {
    const target = t.targetBillNo || '';
    if (target && bills[target]) {
      const pmt = parseFloat(t.payment) || 0;
      bills[target].totalPaid += pmt;
      bills[target].due -= pmt;
      bills[target].payments.push({
        id: t.id,
        payment: pmt,
        date: t.paymentDate || t.date,
        signature: t.signature,
      });
    }
  });

  // Round values
  Object.values(bills).forEach((b) => {
    b.totalPaid = Math.round(b.totalPaid * 100) / 100;
    b.due = Math.round(b.due * 100) / 100;
  });

  return Object.values(bills);
}

function updateTransaction(id, dlNumber, updates) {
  const all = readJSON(TRANSACTIONS_FILE);
  const index = all.findIndex(t => t.id === id && t.dlNumber === dlNumber);
  if (index !== -1) {
    all[index] = { ...all[index], ...updates };
    writeJSON(TRANSACTIONS_FILE, all);
    return all[index];
  }
  return null;
}

function deleteTransaction(id, dlNumber) {
  let all = readJSON(TRANSACTIONS_FILE);
  all = all.filter(t => !(t.id === id && t.dlNumber === dlNumber));
  writeJSON(TRANSACTIONS_FILE, all);
}

function deleteTransactionsByDL(dlNumber) {
  let all = readJSON(TRANSACTIONS_FILE);
  all = all.filter(t => t.dlNumber !== dlNumber);
  writeJSON(TRANSACTIONS_FILE, all);
}

module.exports = {
  getAllUsers,
  getUserByDL,
  getUserByShopName,
  getUserByDoctorName,
  getUsersByShopName,
  getUsersByDoctorName,
  deleteUser,
  createUser,
  getTransactionsByDL,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  deleteTransactionsByDL,
  getSummary,
  getBillWiseSummary,
  USERS_FILE,
  TRANSACTIONS_FILE,
  readJSON,
};
