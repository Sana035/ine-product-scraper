const express = require('express');
const router = express.Router();
const {
  getProducts,
  trackProduct,
  getProductById,
  deleteProduct,
  getProductHistory,
  getProductLogs,
  manualScrape
} = require('../controllers/productController');

router.get('/', getProducts);
router.post('/', trackProduct);
router.get('/:id', getProductById);
router.delete('/:id', deleteProduct);
router.get('/:id/history', getProductHistory);
router.get('/:id/logs', getProductLogs);
router.post('/:id/scrape', manualScrape);

module.exports = router;
