const express = require('express');
const {
  getInvoices,
  getInvoice,
  createInvoiceFromEvent,
  updateInvoice,
  deleteInvoice,
  addPayment,
  deletePayment,
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/').get(getInvoices).post(createInvoiceFromEvent);
router.route('/:id').get(getInvoice).put(updateInvoice).delete(deleteInvoice);
router.route('/:id/payments').post(addPayment);
router.route('/:id/payments/:paymentId').delete(deletePayment);

module.exports = router;
