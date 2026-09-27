const express = require('express');
const router = express.Router();
const { handleCronScrape } = require('../controllers/cronController');

router.post('/scrape', handleCronScrape);

module.exports = router;
