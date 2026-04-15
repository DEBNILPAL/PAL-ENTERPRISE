const jwt = require('jsonwebtoken');
const jsonDb = require('../database/jsonDb');
const pgDb = require('../database/pgDb');

// POST /api/signup
async function signup(req, res) {
  try {
    const { shopName, address, dlNumber, ledgerFolio, phone, doctorName } = req.body;

    // Validation
    if (!shopName || !dlNumber || !phone) {
      return res.status(400).json({ error: 'Shop Name, DL Number, and Phone are required.' });
    }

    // Create user in JSON
    const result = jsonDb.createUser({ shopName, address, dlNumber, ledgerFolio, phone, doctorName: doctorName || '' });

    if (result.error) {
      return res.status(409).json({ error: result.error });
    }

    // Dual-write to PostgreSQL if enabled
    await pgDb.pgCreateUser(result.user);

    // Generate JWT
    const token = jwt.sign(
      { dlNumber: result.user.dlNumber, shopName: result.user.shopName },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Shop registered successfully!',
      token,
      user: {
        shopName: result.user.shopName,
        dlNumber: result.user.dlNumber,
        address: result.user.address,
        ledgerFolio: result.user.ledgerFolio,
        phone: result.user.phone,
        doctorName: result.user.doctorName || '',
      },
    });
  } catch (err) {
    console.error('[Auth] Signup error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// POST /api/login
async function login(req, res) {
  try {
    const { dlNumber, phone, shopName, doctorName } = req.body;

    let user = null;
    let wrongPassword = false;

    // Option 1: DL Number + Phone
    if (dlNumber && phone) {
      user = jsonDb.getUserByDL(dlNumber);
      if (!user) {
        return res.status(404).json({ error: 'No account found with this DL Number. Please sign up first.', notFound: true });
      }
      if (user.phone !== phone) {
        wrongPassword = true;
        return res.status(401).json({ error: 'Invalid credentials. Phone number does not match.', wrongCredentials: true });
      }
    }
    // Option 2: Shop Name (as password)
    else if (shopName) {
      user = jsonDb.getUserByShopName(shopName);
      if (!user) {
        return res.status(404).json({ error: 'No shop found with this name. Please sign up first.', notFound: true });
      }
    }
    // Option 3: Doctor's Name
    else if (doctorName) {
      user = jsonDb.getUserByDoctorName(doctorName);
      if (!user) {
        return res.status(404).json({ error: 'No account found with this Doctor\'s Name. Please sign up first.', notFound: true });
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'No matching account found. Please sign up.', notFound: true });
    }

    const token = jwt.sign(
      { dlNumber: user.dlNumber, shopName: user.shopName },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful!',
      token,
      user: {
        shopName: user.shopName,
        dlNumber: user.dlNumber,
        address: user.address,
        ledgerFolio: user.ledgerFolio,
        phone: user.phone,
        doctorName: user.doctorName || '',
      },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { signup, login };
