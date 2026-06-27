const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bip39 = require('bip39');
const { supabase } = require('../config/db');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const signup = async (req, res) => {
  try {
    const { email, mnemonic } = req.body;

    if (!email || !mnemonic) {
      return res.status(400).json({
        success: false,
        message: 'Email and mnemonic are required',
      });
    }

    const cleanMnemonic = mnemonic.trim().toLowerCase();
    if (!bip39.validateMnemonic(cleanMnemonic)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mnemonic phrase',
      });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const mnemonicHash = await bcrypt.hash(cleanMnemonic, salt);

    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const walletId = `WLT-${String((count || 0) + 1).padStart(5, '0')}`;

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        mnemonic_hash: mnemonicHash,
        wallet_id: walletId,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        id: newUser.id,
        email: newUser.email,
        walletId: newUser.wallet_id,
        token: generateToken(newUser.id),
      },
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during signup',
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, mnemonic } = req.body;

    if (!email || !mnemonic) {
      return res.status(400).json({
        success: false,
        message: 'Email and mnemonic are required',
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account suspended. Contact support.',
      });
    }

    const cleanMnemonic = mnemonic.trim().toLowerCase();
    const isMatch = await bcrypt.compare(cleanMnemonic, user.mnemonic_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid recovery phrase',
      });
    }

    const { data: balances } = await supabase
      .from('balances')
      .select('*')
      .eq('user_id', user.id)
      .single();

    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        email: user.email,
        walletId: user.wallet_id,
        displayName: user.display_name,
        balances: balances || {},
        token: generateToken(user.id),
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, wallet_id, display_name, status, last_login, created_at')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    const { data: balances } = await supabase
      .from('balances')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return res.status(200).json({
      success: true,
      data: { ...user, balances },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = { signup, login, getProfile };