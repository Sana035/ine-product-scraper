const express = require('express');
const router = express.Router();
const { exportCsvHistory } = require('../controllers/exportController');

router.get('/history.csv', exportCsvHistory);

module.exports = router;
