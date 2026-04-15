const { Pool } = require('pg');
const jsonDb = require('./jsonDb');

let pool = null;
let pgEnabled = false;

async function initPostgres() {
  const { PG_HOST, PG_PORT, PG_USER, PG_PASSWORD, PG_DATABASE } = process.env;

  if (!PG_HOST || !PG_USER) {
    console.log('[DB] PostgreSQL credentials not provided – using JSON storage only.');
    return false;
  }

  try {
    pool = new Pool({
      host: PG_HOST,
      port: parseInt(PG_PORT) || 5432,
      user: PG_USER,
      password: PG_PASSWORD,
      database: PG_DATABASE || 'pal_enterprise',
    });

    await pool.query('SELECT NOW()');
    console.log('[DB] PostgreSQL connected successfully.');
    pgEnabled = true;

    await createTables();
    await migrateFromJSON();

    return true;
  } catch (err) {
    console.log('[DB] PostgreSQL connection failed – falling back to JSON storage.');
    console.log('[DB] Error:', err.message);
    pool = null;
    pgEnabled = false;
    return false;
  }
}

async function createTables() {
  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      shop_name VARCHAR(255) NOT NULL,
      address TEXT,
      dl_number VARCHAR(100) UNIQUE NOT NULL,
      ledger_folio VARCHAR(100),
      phone VARCHAR(20),
      doctor_name VARCHAR(255) DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const transactionsTable = `
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      dl_number VARCHAR(100) REFERENCES users(dl_number) ON DELETE CASCADE,
      date VARCHAR(50),
      bill_no VARCHAR(100),
      amount DECIMAL(12,2) DEFAULT 0,
      payment DECIMAL(12,2) DEFAULT 0,
      payment_date VARCHAR(50),
      return_goods TEXT,
      exp_goods TEXT,
      signature TEXT,
      type VARCHAR(20) DEFAULT 'bill',
      target_bill_no VARCHAR(100) DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await pool.query(usersTable);
  await pool.query(transactionsTable);

  // Add columns if they don't exist (for existing databases)
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(255) DEFAULT ''`);
    await pool.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS target_bill_no VARCHAR(100) DEFAULT ''`);
  } catch (e) { /* columns already exist */ }

  console.log('[DB] PostgreSQL tables ensured.');
}

async function migrateFromJSON() {
  try {
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) > 0) {
      console.log('[DB] PostgreSQL already has data – skipping migration.');
      return;
    }

    const users = jsonDb.getAllUsers();
    for (const u of users) {
      await pool.query(
        `INSERT INTO users (shop_name, address, dl_number, ledger_folio, phone, doctor_name, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (dl_number) DO NOTHING`,
        [u.shopName, u.address, u.dlNumber, u.ledgerFolio, u.phone, u.doctorName || '', u.createdAt || new Date().toISOString()]
      );
    }

    const txns = jsonDb.readJSON(jsonDb.TRANSACTIONS_FILE);
    for (const t of txns) {
      await pool.query(
        `INSERT INTO transactions (dl_number, date, bill_no, amount, payment, payment_date, return_goods, exp_goods, signature, type, target_bill_no, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [t.dlNumber, t.date, t.billNo, t.amount, t.payment, t.paymentDate, t.returnGoods, t.expGoods, t.signature, t.type || 'bill', t.targetBillNo || '', t.createdAt || new Date().toISOString()]
      );
    }

    console.log(`[DB] Migrated ${users.length} users and ${txns.length} transactions to PostgreSQL.`);
  } catch (err) {
    console.error('[DB] Migration error:', err.message);
  }
}

async function pgCreateUser(user) {
  if (!pgEnabled) return;
  try {
    await pool.query(
      `INSERT INTO users (shop_name, address, dl_number, ledger_folio, phone, doctor_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (dl_number) DO NOTHING`,
      [user.shopName, user.address, user.dlNumber, user.ledgerFolio, user.phone, user.doctorName || '']
    );
  } catch (err) {
    console.error('[PG] Error creating user:', err.message);
  }
}

async function pgAddTransaction(entry) {
  if (!pgEnabled) return;
  try {
    await pool.query(
      `INSERT INTO transactions (dl_number, date, bill_no, amount, payment, payment_date, return_goods, exp_goods, signature, type, target_bill_no)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [entry.dlNumber, entry.date, entry.billNo, entry.amount, entry.payment, entry.paymentDate, entry.returnGoods, entry.expGoods, entry.signature, entry.type || 'bill', entry.targetBillNo || '']
    );
  } catch (err) {
    console.error('[PG] Error adding transaction:', err.message);
  }
}

async function pgUpdateTransaction(id, updates) {
  if (!pgEnabled) return;
  try {
    // Basic mapping (assuming updates object matches JSON schema keys, adjusting for snake_case if needed)
    // We update by `id`, but since JSON gives a string ID and PG uses a SERIAL `id`.. wait, the IDs in JSON are strings like Date.now().
    // If PG created its own serial ID, matching them is hard unless we used json_id. The existing PG schema uses SERIAL for id, and jsonDb uses a string ID.
    // Let's rely on dl_number and bill_no and date to match, or add logic to handle it if the user wants. The simplest way is to delete and re-insert if we can't match IDs easily, BUT let's just do a basic UPDATE if possible. Or update by bill_no.
    
    // Actually, editing bill uses billNo. We can update based on dl_number and old_billNo
    let query = `UPDATE transactions SET amount = $1, return_goods = $2, exp_goods = $3, date = $4, bill_no = $5 WHERE dl_number = $6 AND bill_no = $7 AND type = 'bill'`;
    // We should pass old_billNo or just id if we had it, but PG id != JSON id. We can use dl_number + billNo + type='bill'
    await pool.query(query, [
      updates.amount, 
      updates.returnGoods || '', 
      updates.expGoods || '', 
      updates.date, 
      updates.billNo, 
      updates.dlNumber, 
      updates.oldBillNo || updates.billNo
    ]);
  } catch (err) {
    console.error('[PG] Error updating transaction:', err.message);
  }
}

async function pgDeleteTransaction(dlNumber, billNo) {
  if (!pgEnabled) return;
  try {
    await pool.query(`DELETE FROM transactions WHERE dl_number = $1 AND bill_no = $2 AND type = 'bill'`, [dlNumber, billNo]);
  } catch (err) {
    console.error('[PG] Error deleting transaction:', err.message);
  }
}

async function pgDeleteUser(dlNumber) {
  if (!pgEnabled) return;
  try {
    await pool.query(`DELETE FROM users WHERE dl_number = $1`, [dlNumber]);
  } catch (err) {
    console.error('[PG] Error deleting user:', err.message);
  }
}

module.exports = {
  initPostgres,
  pgCreateUser,
  pgAddTransaction,
  pgUpdateTransaction,
  pgDeleteTransaction,
  pgDeleteUser,
  isPgEnabled: () => pgEnabled,
};
