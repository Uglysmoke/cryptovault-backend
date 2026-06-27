const express = require('express');
const router = express.Router();
const {
  getBalances,
  getTransactions,
  submitDeposit,
  submitWithdrawal,
  getWalletAddresses,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/balances', protect, getBalances);
router.get('/transactions', protect, getTransactions);
router.get('/addresses', getWalletAddresses);
router.post('/deposit', protect, submitDeposit);
router.post('/withdrawal', protect, submitWithdrawal);

module.exports = router;