const jwt = require('jsonwebtoken');
const { supabase } = require('../config/db');

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials',
      });
    }

    const token = jwt.sign(
      { role: 'admin', email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: { token },
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, wallet_id, display_name, status, last_login, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateBalance = async (req, res) => {
  try {
    const { userId, asset, amount, action, note } = req.body;

    if (!userId || !asset || !amount || !action) {
      return res.status(400).json({
        success: false,
        message: 'userId, asset, amount and action are required',
      });
    }

    const assetColumn = asset.toLowerCase();
    const parsedAmount = parseFloat(amount);

    const { data: balanceRow, error: balanceError } = await supabase
      .from('balances')
      .select(assetColumn)
      .eq('user_id', userId)
      .single();

    if (balanceError) throw balanceError;

    const currentBalance = balanceRow?.[assetColumn] || 0;

    if (action === 'debit' && parsedAmount > currentBalance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance for debit',
      });
    }

    const newBalance = action === 'credit'
      ? currentBalance + parsedAmount
      : Math.max(0, currentBalance - parsedAmount);

    const { error: updateError } = await supabase
      .from('balances')
      .update({ [assetColumn]: newBalance })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    await supabase.from('transactions').insert({
      user_id: userId,
      type: action === 'credit' ? 'deposit' : 'withdrawal',
      asset: asset.toUpperCase(),
      amount: parsedAmount,
      status: 'completed',
      note: note || `Admin ${action}: ${parsedAmount} ${asset}`,
      processed_by: 'admin',
      processed_at: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: `Balance ${action}ed successfully`,
      data: { newBalance, asset },
    });

  } catch (error) {
    console.error('Balance update error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { userId, status } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', userId)
      .select('id, email, wallet_id, status')
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: `User ${status} successfully`,
      data,
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPendingTransactions = async (req, res) => {
  try {
    const { type } = req.query;

    let query = supabase
      .from('transactions')
      .select('*, users (email, wallet_id)')
      .order('created_at', { ascending: false });

    if (type) query = query.eq('type', type);

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateTransactionStatus = async (req, res) => {
  try {
    const { transactionId, status } = req.body;

    const { data, error } = await supabase
      .from('transactions')
      .update({
        status,
        processed_by: 'admin',
        processed_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: `Transaction ${status}`,
      data,
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAddresses = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('wallet_addresses')
      .select('*')
      .order('symbol');

    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateAddress = async (req, res) => {
  try {
    const { symbol, address } = req.body;

    const { data, error } = await supabase
      .from('wallet_addresses')
      .update({ address })
      .eq('symbol', symbol)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data,
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getInsuranceClaims = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('insurance_claims')
      .select('*, users (email, wallet_id)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  adminLogin,
  getAllUsers,
  updateBalance,
  updateUserStatus,
  getPendingTransactions,
  updateTransactionStatus,
  getAddresses,
  updateAddress,
  getInsuranceClaims,
};