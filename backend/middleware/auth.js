const jwt = require('jsonwebtoken');

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "Authentication required. Please log in." });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token. Please log in again." });
    }
    
    // Check if required user properties exist
    if (!decoded || !decoded.rollno) {
      return res.status(403).json({ 
        message: "Invalid token format. Missing required user data.",
        details: "The authentication token does not contain the expected user identifier."
      });
    }
    
    req.user = decoded;
    console.log("Authenticated user:", { rollno: decoded.rollno });
    next();
  });
}

module.exports = {
  authenticateToken
}; 