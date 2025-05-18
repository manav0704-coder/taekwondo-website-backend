const express = require('express');
const {
  getGalleryItems,
  getGalleryItem,
  getGalleryByCategory
} = require('../controllers/gallery');

const router = express.Router();

router.route('/category/:category').get(getGalleryByCategory);

router
  .route('/')
  .get(getGalleryItems);

router
  .route('/:id')
  .get(getGalleryItem);

module.exports = router; 