const express = require('express');
const router = express.Router();
const {
  createAsset,
  getAssets,
  getAsset,
  updateAsset,
  deleteAsset,
  upload
} = require('../controller/assetsController');

const verifyJWT = require('../middleware/verifyJWT');
const verifyAdmin = require('../middleware/verifyAdmin');

// All routes require authentication and admin access
router.use(verifyJWT);
router.use(verifyAdmin);

// Routes
router.post('/', upload, createAsset);
router.get('/', getAssets);
router.get('/:id', getAsset);
router.put('/:id', upload, updateAsset);
router.delete('/:id', deleteAsset);

module.exports = router;
