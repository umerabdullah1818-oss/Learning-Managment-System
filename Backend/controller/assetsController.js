const Asset = require('../models/Asset');
const asyncHandler = require('express-async-handler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for asset cover image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'asset-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
}).fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'title', maxCount: 1 },
  { name: 'category', maxCount: 1 },
  { name: 'author', maxCount: 1 },
  { name: 'publisher', maxCount: 1 },
  { name: 'isbn', maxCount: 1 },
  { name: 'edition', maxCount: 1 },
  { name: 'year', maxCount: 1 },
  { name: 'description', maxCount: 1 },
  { name: 'location', maxCount: 1 },
  { name: 'status', maxCount: 1 },
  { name: 'copies', maxCount: 1 },
  { name: 'price', maxCount: 1 },
  { name: 'acquisitionDate', maxCount: 1 },
  { name: 'callNumber', maxCount: 1 },
  { name: 'barcode', maxCount: 1 },
  { name: 'language', maxCount: 1 },
  { name: 'pages', maxCount: 1 },
  { name: 'subjects', maxCount: 1 },
  { name: 'notes', maxCount: 1 }
]);

// @desc    Create a new asset
// @route   POST /api/assets
// @access  Private/Admin
const createAsset = asyncHandler(async (req, res) => {
  const {
    title,
    category,
    author,
    publisher,
    isbn,
    edition,
    year,
    description,
    location,
    status,
    copies,
    price,
    acquisitionDate,
    callNumber,
    barcode,
    language,
    pages,
    subjects,
    notes
  } = req.body;

  // Handle cover image
  let coverImage = null;
  if (req.files && req.files.coverImage && req.files.coverImage[0]) {
    coverImage = req.files.coverImage[0].filename;
  }

  const assetData = {
    title,
    category,
    authors: author, // Note: model uses 'authors'
    publisher,
    isbn_issn: isbn,
    edition,
    publication_year: year,
    description,
    cover_image: coverImage,
    location,
    status: status || 'available',
    copies: copies || 1,
    price: price || 0.00,
    acquisition_date: acquisitionDate,
    call_number: callNumber,
    barcode,
    language,
    pages,
    subjects,
    internal_notes: notes
  };

  const asset = await Asset.createAsset(assetData);

  res.status(201).json({
    success: true,
    message: 'Asset created successfully',
    data: asset
  });
});

// @desc    Get all assets
// @route   GET /api/assets
// @access  Private/Admin
const getAssets = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const filters = {};
  if (req.query.search) filters.search = req.query.search;
  if (req.query.category) filters.category = req.query.category;
  if (req.query.status) filters.status = req.query.status;
  if (req.query.location) filters.location = req.query.location;

  const { rows, total } = await Asset.getAllAssets(limit, offset, filters);

  res.status(200).json({
    success: true,
    data: rows,
    pagination: {
      page,
      limit,
      total
    }
  });
});

// @desc    Get single asset
// @route   GET /api/assets/:id
// @access  Private/Admin
const getAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findAssetById(req.params.id);

  if (!asset) {
    res.status(404);
    throw new Error('Asset not found');
  }

  res.status(200).json({
    success: true,
    data: asset
  });
});

// @desc    Update asset
// @route   PUT /api/assets/:id
// @access  Private/Admin
const updateAsset = asyncHandler(async (req, res) => {
  console.log('Update request received for asset ID:', req.params.id);
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);

  const asset = await Asset.findAssetById(req.params.id);

  if (!asset) {
    res.status(404);
    throw new Error('Asset not found');
  }

  const {
    title,
    category,
    author,
    publisher,
    isbn,
    edition,
    year,
    description,
    location,
    status,
    copies,
    price,
    acquisitionDate,
    callNumber,
    barcode,
    language,
    pages,
    subjects,
    notes
  } = req.body;

  // Handle cover image
  let coverImage = asset.cover_image; // Keep existing image
  if (req.files && req.files.coverImage && req.files.coverImage[0]) {
    coverImage = req.files.coverImage[0].filename;
  }

  const assetData = {
    title,
    category,
    authors: author, // Note: model uses 'authors'
    publisher,
    isbn_issn: isbn,
    edition,
    publication_year: year,
    description,
    cover_image: coverImage,
    location,
    status: status || 'available',
    copies: copies || 1,
    price: price || 0.00,
    acquisition_date: acquisitionDate,
    call_number: callNumber,
    barcode,
    language,
    pages,
    subjects,
    internal_notes: notes
  };

  const updatedAsset = await Asset.updateAsset(req.params.id, assetData);

  res.status(200).json({
    success: true,
    message: 'Asset updated successfully',
    data: updatedAsset
  });
});

// @desc    Delete asset
// @route   DELETE /api/assets/:id
// @access  Private/Admin
const deleteAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findAssetById(req.params.id);

  if (!asset) {
    res.status(404);
    throw new Error('Asset not found');
  }

  await Asset.deleteAsset(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Asset deleted successfully'
  });
});

module.exports = {
  createAsset,
  getAssets,
  getAsset,
  updateAsset,
  deleteAsset,
  upload
};
