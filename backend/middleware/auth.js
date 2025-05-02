const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    
    // Check if required user properties exist
    if (!decoded || (!decoded.id && !decoded.rollno && !decoded.studentId && !decoded.teacherId)) {
      return res.status(403).json({ 
        message: "Invalid token format. Missing required user data.",
        details: "The authentication token does not contain the expected user identifier."
      });
    }
    
    req.user = decoded;
    next();
  });
}

module.exports = {
  authenticateToken
}; 