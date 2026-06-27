const mongoose = require('mongoose');

const walletAddressSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true },
  name:   { type: String, required: true },
  logo:   { type: String, default: '🪙' },
  network:{ type: String, required: true },
  address:{ type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('WalletAddress', walletAddressSchema);