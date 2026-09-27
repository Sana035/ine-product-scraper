const express = require('express');
const router = express.Router();
const { searchCatalog } = require('../controllers/catalogController');

router.get('/search', searchCatalog);

module.exports = router;
