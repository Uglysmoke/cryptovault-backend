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
} = require('../controllers/adminController');

router.post('/login', adminLogin);
router.get('/users', getAllUsers);
router.put('/balance', updateBalance);
router.put('/user-status', updateUserStatus);
router.get('/transactions', getPendingTransactions);
router.put('/transaction-status', updateTransactionStatus);
router.get('/addresses', getAddresses);
router.put('/address', updateAddress);
router.get('/claims', getInsuranceClaims);

module.exports = router;