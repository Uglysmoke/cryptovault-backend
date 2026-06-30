const { supabase } = require('../config/db');

const getBalances = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('balances').select('*')
      .eq('user_id', req.user.id).single();
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions').select('*')
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
        success: false, message: 'Asset, amount and TX hash are required',
      });
    }
    const { data, error } = await supabase.from('transactions').insert({
      user_id: req.user.id,
      type: 'deposit',
      asset: asset.toUpperCase(),
      amount: parseFloat(amount),
      tx_hash: txHash,
      note: note || '',
      status: 'pending',
    }).select().single();
    if (error) throw error;

    // Notify user
    await supabase.from('notifications').insert({
      user_id: req.user.id,
      title: 'Deposit Notice Received',
      message: `Your deposit of ${amount} ${asset.toUpperCase()} is under review.`,
      type: 'deposit',
    });

    return res.status(201).json({ success: true, message: 'Deposit notice submitted', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const submitWithdrawal = async (req, res) => {
  try {
    const { asset, amount, toAddress } = req.body;
    if (!asset || !amount || !toAddress) {
      return res.status(400).json({
        success: false, message: 'Asset, amount and address are required',
      });
    }
    const { data: balances } = await supabase
      .from('balances').select(asset.toLowerCase())
      .eq('user_id', req.user.id).single();
    const currentBalance = balances?.[asset.toLowerCase()] || 0;
    if (parseFloat(amount) > currentBalance) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }
    const { data, error } = await supabase.from('transactions').insert({
      user_id: req.user.id,
      type: 'withdrawal',
      asset: asset.toUpperCase(),
      amount: parseFloat(amount),
      to_address: toAddress,
      status: 'pending',
    }).select().single();
    if (error) throw error;

    // Notify user
    await supabase.from('notifications').insert({
      user_id: req.user.id,
      title: 'Withdrawal Request Received',
      message: `Your withdrawal of ${amount} ${asset.toUpperCase()} is being processed.`,
      type: 'withdrawal',
    });

    return res.status(201).json({ success: true, message: 'Withdrawal submitted', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const submitStake = async (req, res) => {
  try {
    const { asset, amount, apy, lock_period } = req.body;
    if (!asset || !amount || !apy || !lock_period) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }
    const { data, error } = await supabase.from('stakes').insert({
      user_id: req.user.id,
      asset: asset.toUpperCase(),
      amount: parseFloat(amount),
      apy: parseFloat(apy),
      lock_period,
      status: 'pending',
    }).select().single();
    if (error) throw error;

    await supabase.from('notifications').insert({
      user_id: req.user.id,
      title: 'Staking Request Received',
      message: `Your stake of ${amount} ${asset.toUpperCase()} is under review.`,
      type: 'staking',
    });

    return res.status(201).json({ success: true, message: 'Stake submitted', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getStakes = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('stakes').select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const submitInsurance = async (req, res) => {
  try {
    const { plan_name, coverage_amount, monthly_premium, billing_cycle } = req.body;
    if (!plan_name || !coverage_amount) {
      return res.status(400).json({ success: false, message: 'Plan details required' });
    }

    // Check if already has a plan
    const { data: existing } = await supabase
      .from('insurance_plans').select('id')
      .eq('user_id', req.user.id)
      .in('status', ['pending', 'active']).single();

    if (existing) {
      return res.status(400).json({
        success: false, message: 'You already have an active or pending plan',
      });
    }

    const { data, error } = await supabase.from('insurance_plans').insert({
      user_id: req.user.id,
      plan_name,
      coverage_amount: parseFloat(coverage_amount),
      monthly_premium: parseFloat(monthly_premium),
      billing_cycle: billing_cycle || 'monthly',
      status: 'pending',
    }).select().single();
    if (error) throw error;

    await supabase.from('notifications').insert({
      user_id: req.user.id,
      title: 'Insurance Plan Submitted',
      message: `Your ${plan_name} insurance plan is under review.`,
      type: 'insurance',
    });

    return res.status(201).json({ success: true, message: 'Insurance plan submitted', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getInsurance = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('insurance_plans').select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return res.status(200).json({ success: true, data: data || null });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const submitInsuranceClaim = async (req, res) => {
  try {
    const { claim_type, amount, description } = req.body;
    if (!claim_type || !amount || !description) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }
    const { data, error } = await supabase.from('insurance_claims').insert({
      user_id: req.user.id,
      claim_type,
      amount: parseFloat(amount),
      description,
      status: 'pending',
    }).select().single();
    if (error) throw error;
    return res.status(201).json({ success: true, message: 'Claim submitted', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getInsuranceClaims = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('insurance_claims').select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const submitKYC = async (req, res) => {
  try {
    const { full_name, date_of_birth, country, id_type, id_number } = req.body;
    if (!full_name || !date_of_birth || !country || !id_type || !id_number) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    // Upsert (update if exists, insert if not)
    const { data, error } = await supabase.from('kyc').upsert({
      user_id: req.user.id,
      full_name,
      date_of_birth,
      country,
      id_type,
      id_number,
      status: 'pending',
    }, { onConflict: 'user_id' }).select().single();

    if (error) throw error;

    await supabase.from('notifications').insert({
      user_id: req.user.id,
      title: 'KYC Submitted',
      message: 'Your identity verification is under review.',
      type: 'kyc',
    });

    return res.status(201).json({ success: true, message: 'KYC submitted', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getKYC = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('kyc').select('*')
      .eq('user_id', req.user.id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return res.status(200).json({ success: true, data: data || null });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getNotifications = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications').select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const markNotificationsRead = async (req, res) => {
  try {
    await supabase.from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getWalletAddresses = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('wallet_addresses').select('*').eq('is_active', true);
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getBalances, getTransactions, submitDeposit, submitWithdrawal,
  submitStake, getStakes, submitInsurance, getInsurance,
  submitInsuranceClaim, getInsuranceClaims, submitKYC, getKYC,
  getNotifications, markNotificationsRead, getWalletAddresses,
};