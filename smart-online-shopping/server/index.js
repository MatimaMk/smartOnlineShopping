// server/index.js
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Try-on endpoint
app.post('/api/tryon', upload.fields([
  { name: 'userImage', maxCount: 1 },
  { name: 'outfitImage', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files.userImage || !req.files.outfitImage) {
      return res.status(400).json({
        success: false,
        message: 'Both user image and outfit image are required'
      });
    }

    const userImage = req.files.userImage[0];
    const outfitImage = req.files.outfitImage[0];

    // Create composite image using sharp
    const resultFilename = `result-${Date.now()}.png`;
    const resultPath = path.join(uploadsDir, resultFilename);

    // Process images
    const userImagePath = path.join(uploadsDir, userImage.filename);
    const outfitImagePath = path.join(uploadsDir, outfitImage.filename);

    // Get dimensions of user image
    const userImageMetadata = await sharp(userImagePath).metadata();
    const baseWidth = userImageMetadata.width;
    const baseHeight = userImageMetadata.height;

    // Resize outfit image to fit proportionally on the user image
    // Position it in the center-top area (where clothing typically goes)
    const overlayWidth = Math.floor(baseWidth * 0.6); // 60% of user image width
    const overlayHeight = Math.floor(baseHeight * 0.7); // 70% of user image height

    // Resize and prepare outfit image
    const resizedOutfit = await sharp(outfitImagePath)
      .resize(overlayWidth, overlayHeight, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();

    // Calculate position (center horizontally, top 15% vertically)
    const left = Math.floor((baseWidth - overlayWidth) / 2);
    const top = Math.floor(baseHeight * 0.15);

    // Composite the images
    await sharp(userImagePath)
      .composite([{
        input: resizedOutfit,
        top: top,
        left: left,
        blend: 'over'
      }])
      .toFile(resultPath);

    const result = {
      success: true,
      message: 'Try-on processed successfully',
      data: {
        userImageUrl: `/uploads/${userImage.filename}`,
        outfitImageUrl: `/uploads/${outfitImage.filename}`,
        resultImageUrl: `/uploads/${resultFilename}`,
        processedAt: new Date().toISOString()
      }
    };

    res.json(result);
  } catch (error) {
    console.error('Try-on error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing try-on request',
      error: error.message
    });
  }
});

// Get all uploaded images
app.get('/api/tryon/history', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
      .map(file => ({
        filename: file,
        url: `/uploads/${file}`,
        uploadedAt: fs.statSync(path.join(uploadsDir, file)).mtime
      }))
      .sort((a, b) => b.uploadedAt - a.uploadedAt);

    res.json({
      success: true,
      data: images
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching try-on history',
      error: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Online Shopping - Try-On API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      tryon: 'POST /api/tryon',
      history: 'GET /api/tryon/history'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size is too large. Maximum size is 10MB'
      });
    }
  }

  res.status(500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Try-on server is running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
});
