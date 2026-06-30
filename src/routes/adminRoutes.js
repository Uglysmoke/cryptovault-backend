const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');

router.post('/login',                adminLogin);
router.get('/users',                 getAllUsers);
router.put('/balance',               updateBalance);
router.put('/user-status',           updateUserStatus);
router.get('/transactions',          getPendingTransactions);
router.put('/transaction-status',    updateTransactionStatus);
router.get('/addresses',             getAddresses);
router.put('/address',               updateAddress);
router.get('/claims',                getInsuranceClaims);
router.get('/kyc',                   getKYCList);
router.put('/kyc/review',            reviewKYC);
router.get('/stakes',                getStakes);
router.put('/stake/review',          reviewStake);
router.get('/insurance',             getInsurancePlans);
router.put('/insurance/review',      reviewInsurance);
router.post('/notify',               sendNotification);

module.exports = router;