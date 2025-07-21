import multer from 'multer';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter to accept only PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  }
});

// Middleware function
export const uploadResume = (req, res, next) => {
  const singleUpload = upload.single('resume');
  
  singleUpload(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            message: 'File too large. Maximum size is 5MB.' 
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ 
            message: 'Too many files. Only one file allowed.' 
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ 
            message: 'Unexpected field name. Use "resume" as the field name.' 
          });
        }
      }
      
      return res.status(400).json({ 
        message: err.message || 'File upload failed.' 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        message: 'No file uploaded. Please select a PDF resume.' 
      });
    }
    
    next();
  });
};