const { supabase } = require('../config/db');

const getBalances = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('balances')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const submitDeposit = async (req, res) => {
  try {
    const { asset, amount, txHash, note } = req.body;

    if (!asset || !amount || !txHash) {
      return res.status(400).json({
        success: false,
        message: 'Asset, amount and TX hash are required',
      });
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: req.user.id,
        type: 'deposit',
        asset: asset.toUpperCase(),
        amount: parseFloat(amount),
        tx_hash: txHash,
        note: note || '',
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'Deposit notice submitted successfully',
      data,
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const submitWithdrawal = async (req, res) => {
  try {
    const { asset, amount, toAddress } = req.body;

    if (!asset || !amount || !toAddress) {
      return res.status(400).json({
        success: false,
        message: 'Asset, amount and address are required',
      });
    }

    const { data: balances } = await supabase
      .from('balances')
      .select(asset.toLowerCase())
      .eq('user_id', req.user.id)
      .single();

    const currentBalance = balances?.[asset.toLowerCase()] || 0;

    if (parseFloat(amount) > currentBalance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
      });
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: req.user.id,
        type: 'withdrawal',
        asset: asset.toUpperCase(),
        amount: parseFloat(amount),
        to_address: toAddress,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data,
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getWalletAddresses = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('wallet_addresses')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getBalances,
  getTransactions,
  submitDeposit,
  submitWithdrawal,
  getWalletAddresses,
};