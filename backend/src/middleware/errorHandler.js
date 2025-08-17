export function notFound(req, res, next) {
    res.status(404).json({ message: 'Not Found' });
  }
  
  export function errorHandler(err, req, res, next) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
  