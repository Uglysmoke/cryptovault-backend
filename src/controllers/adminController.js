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
const getKYCList = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('kyc')
      .select('*, users (email, wallet_id)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const reviewKYC = async (req, res) => {
  try {
    const { kycId, status, reason } = req.body;
    const { data: kycRecord, error: fetchError } = await supabase
      .from('kyc').select('user_id').eq('id', kycId).single();
    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('kyc')
      .update({
        status,
        rejection_reason: reason || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', kycId).select().single();
    if (error) throw error;

    // Notify user
    const notifTitle = status === 'approved'
      ? 'Identity Verified ✅'
      : 'Verification Update';
    const notifMsg = status === 'approved'
      ? 'Your identity has been successfully verified.'
      : `Your verification needs attention. Please check your KYC status.`;

    await supabase.from('notifications').insert({
      user_id: kycRecord.user_id,
      title: notifTitle,
      message: notifMsg,
      type: 'kyc',
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getStakes = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('stakes')
      .select('*, users (email, wallet_id)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const reviewStake = async (req, res) => {
  try {
    const { stakeId, status } = req.body;
    const { data: stakeRecord } = await supabase
      .from('stakes').select('user_id, asset, amount')
      .eq('id', stakeId).single();

    const updateData = { status };
    if (status === 'active') {
      updateData.start_date = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('stakes').update(updateData)
      .eq('id', stakeId).select().single();
    if (error) throw error;

    // Notify user
    const msg = status === 'active'
      ? `Your stake of ${stakeRecord.amount} ${stakeRecord.asset} is now active and earning rewards.`
      : `Your staking request for ${stakeRecord.amount} ${stakeRecord.asset} could not be processed.`;

    await supabase.from('notifications').insert({
      user_id: stakeRecord.user_id,
      title: status === 'active' ? 'Stake Activated ✅' : 'Stake Update',
      message: msg,
      type: 'staking',
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getInsurancePlans = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('insurance_plans')
      .select('*, users (email, wallet_id)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const reviewInsurance = async (req, res) => {
  try {
    const { planId, status } = req.body;
    const { data: planRecord } = await supabase
      .from('insurance_plans').select('user_id, plan_name')
      .eq('id', planId).single();

    const { data, error } = await supabase
      .from('insurance_plans').update({ status })
      .eq('id', planId).select().single();
    if (error) throw error;

    const msg = status === 'active'
      ? `Your ${planRecord.plan_name} insurance plan is now active.`
      : `Your insurance plan request has been updated.`;

    await supabase.from('notifications').insert({
      user_id: planRecord.user_id,
      title: status === 'active' ? 'Insurance Active ✅' : 'Insurance Update',
      message: msg,
      type: 'insurance',
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const sendNotification = async (req, res) => {
  try {
    const { userId, title, message } = req.body;
    const { data, error } = await supabase.from('notifications').insert({
      user_id: userId, title, message, type: 'info',
    }).select().single();
    if (error) throw error;
    return res.status(201).json({ success: true, data });
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
  getKYCList,
  reviewKYC,
  getStakes,
  reviewStake,
  getInsurancePlans,
  reviewInsurance,
  sendNotification,
};