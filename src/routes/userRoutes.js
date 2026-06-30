const express = require('express');
const router = express.Router();
const {
  getBalances,
  getTransactions,
  submitDeposit,
  submitWithdrawal,
  getWalletAddresses,
  submitStake,
  getStakes,
  submitInsurance,
  getInsurance,
  submitInsuranceClaim,
  getInsuranceClaims,
  submitKYC,
  getKYC,
  getNotifications,
  markNotificationsRead,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/balances',              protect, getBalances);
router.get('/transactions',          protect, getTransactions);
router.get('/addresses',                      getWalletAddresses);
router.post('/deposit',              protect, submitDeposit);
router.post('/withdrawal',           protect, submitWithdrawal);
router.post('/stake',                protect, submitStake);
router.get('/stakes',                protect, getStakes);
router.post('/insurance',            protect, submitInsurance);
router.get('/insurance',             protect, getInsurance);
router.post('/insurance/claim',      protect, submitInsuranceClaim);
router.get('/insurance/claims',      protect, getInsuranceClaims);
router.post('/kyc',                  protect, submitKYC);
router.get('/kyc',                   protect, getKYC);
router.get('/notifications',         protect, getNotifications);
router.put('/notifications/read',    protect, markNotificationsRead);

module.exports = router;