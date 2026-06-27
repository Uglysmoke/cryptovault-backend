const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  // Hashed mnemonic phrase
  mnemonicHash: {
    type: String,
    required: true,
  },

  // Hashed PIN
  pinHash: {
    type: String,
    default: null,
  },

  walletId: {
    type: String,
    unique: true,
  },

  displayName: {
    type: String,
    default: 'CryptoUser',
  },

  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active',
  },

  // User's crypto balances
  balances: {
    BTC:  { type: Number, default: 0 },
    ETH:  { type: Number, default: 0 },
    XRP:  { type: Number, default: 0 },
    XLM:  { type: Number, default: 0 },
    USDT: { type: Number, default: 0 },
    USDC: { type: Number, default: 0 },
    BNB:  { type: Number, default: 0 },
    SOL:  { type: Number, default: 0 },
    ADA:  { type: Number, default: 0 },
    DOGE: { type: Number, default: 0 },
    MATIC:{ type: Number, default: 0 },
    AVAX: { type: Number, default: 0 },
    LTC:  { type: Number, default: 0 },
    TRX:  { type: Number, default: 0 },
    LINK: { type: Number, default: 0 },
  },

  lastLogin: {
    type: Date,
    default: null,
  },

}, { timestamps: true });

// Generate wallet ID before saving
userSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('User').countDocuments();
    this.walletId = `WLT-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Method to check mnemonic
userSchema.methods.matchMnemonic = async function (mnemonic) {
  return await bcrypt.compare(mnemonic.trim().toLowerCase(), this.mnemonicHash);
};

// Method to check PIN
userSchema.methods.matchPin = async function (pin) {
  return await bcrypt.compare(pin, this.pinHash);
};

module.exports = mongoose.model('User', userSchema);