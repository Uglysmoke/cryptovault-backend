const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'swap', 'staking'],
    required: true,
  },

  asset: {
    type: String,
    required: true,
  },

  amount: {
    type: Number,
    required: true,
  },

  // For swaps
  toAsset: { type: String, default: null },
  toAmount: { type: Number, default: null },

  // For withdrawals
  toAddress: { type: String, default: null },

  txHash: { type: String, default: null },

  status: {
    type: String,
    enum: ['pending', 'completed', 'rejected', 'on_hold'],
    default: 'pending',
  },

  note: { type: String, default: '' },

  // Admin who processed it
  processedBy: { type: String, default: null },
  processedAt: { type: Date, default: null },

}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);