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

    // Option 1: DL Number + Phone
    if (dlNumber && phone) {
      user = jsonDb.getUserByDL(dlNumber);
      if (!user) {
        return res.status(404).json({ error: 'No account found with this DL Number. Please sign up first.', notFound: true });
      }
      if (user.phone !== phone) {
        return res.status(401).json({ error: 'Invalid credentials. Phone number does not match.', wrongCredentials: true });
      }
    }
    // Option 2: Shop Name
    else if (shopName) {
      // Check if multiple shops exist with same name
      const matchingUsers = jsonDb.getUsersByShopName(shopName);
      if (matchingUsers.length === 0) {
        return res.status(404).json({ error: 'No shop found with this name. Please sign up first.', notFound: true });
      }
      if (matchingUsers.length > 1) {
        // If no disambiguator provided, tell frontend there are multiple matches
        if (!req.body.disambiguatorPhone && !req.body.disambiguatorDL) {
          return res.status(200).json({
            multipleFound: true,
            count: matchingUsers.length,
            message: `There are ${matchingUsers.length} shops with the name "${shopName}". Please provide your Mobile Number or DL Number to identify your account.`,
          });
        }
        // Disambiguate by phone
        if (req.body.disambiguatorPhone) {
          user = matchingUsers.find(u => u.phone === req.body.disambiguatorPhone);
          if (!user) {
            return res.status(401).json({ error: 'No shop found with this name and phone number combination.', wrongCredentials: true });
          }
        }
        // Disambiguate by DL number
        else if (req.body.disambiguatorDL) {
          user = matchingUsers.find(u => u.dlNumber === req.body.disambiguatorDL);
          if (!user) {
            return res.status(401).json({ error: 'No shop found with this name and DL number combination.', wrongCredentials: true });
          }
        }
      } else {
        user = matchingUsers[0];
      }
    }
    // Option 3: Doctor's Name
    else if (doctorName) {
      // Check if multiple doctors exist with same name
      const matchingUsers = jsonDb.getUsersByDoctorName(doctorName);
      if (matchingUsers.length === 0) {
        return res.status(404).json({ error: 'No account found with this Doctor\'s Name. Please sign up first.', notFound: true });
      }
      if (matchingUsers.length > 1) {
        // If no disambiguator provided, tell frontend there are multiple matches
        if (!req.body.disambiguatorPhone && !req.body.disambiguatorDL) {
          return res.status(200).json({
            multipleFound: true,
            count: matchingUsers.length,
            message: `There are ${matchingUsers.length} accounts with Doctor name "${doctorName}". Please provide your Mobile Number or DL Number to identify your account.`,
          });
        }
        // Disambiguate by phone
        if (req.body.disambiguatorPhone) {
          user = matchingUsers.find(u => u.phone === req.body.disambiguatorPhone);
          if (!user) {
            return res.status(401).json({ error: 'No account found with this doctor name and phone number combination.', wrongCredentials: true });
          }
        }
        // Disambiguate by DL number
        else if (req.body.disambiguatorDL) {
          user = matchingUsers.find(u => u.dlNumber === req.body.disambiguatorDL);
          if (!user) {
            return res.status(401).json({ error: 'No account found with this doctor name and DL number combination.', wrongCredentials: true });
          }
        }
      } else {
        user = matchingUsers[0];
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

// DELETE /api/delete-profile/:dlNumber
async function deleteProfile(req, res) {
  try {
    const { dlNumber } = req.params;
    const { password } = req.body;
    const { dlNumber: authedDL } = req.user;

    // User can only delete their own profile
    if (dlNumber !== authedDL) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own profile.' });
    }

    // Verify admin password
    if (password !== 'sudip@1971') {
      return res.status(403).json({ error: 'Invalid password. Profile deletion denied.' });
    }

    // Delete from JSON
    jsonDb.deleteTransactionsByDL(dlNumber);
    jsonDb.deleteUser(dlNumber);

    // Delete from PG
    await pgDb.pgDeleteUser(dlNumber);

    return res.json({ message: 'Profile and all associated data have been permanently deleted.' });
  } catch (err) {
    console.error('[Auth] Delete profile error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { signup, login, deleteProfile };
