export function notFound(req, res, next) {
    console.warn('[404]', {
      method: req.method,
      path: req.originalUrl
    });
    res.status(404).json({ message: 'Not Found' });
  }
  
  export function errorHandler(err, req, res, next) {
    console.error('[error]', {
      method: req.method,
      path: req.originalUrl,
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
    res.status(err.status || 500).json({
      message: err.message || 'Server error',
      ...(process.env.NODE_ENV === 'production' ? {} : { stack: err.stack })
    });
  }
  
