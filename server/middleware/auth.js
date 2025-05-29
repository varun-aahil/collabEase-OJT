const { getAuth } = require('firebase-admin/auth');

const isAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Authentication failed: No token provided or invalid format');
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      console.log('Authentication failed: Token is empty');
      return res.status(401).json({ message: "Unauthorized: Token is empty" });
    }
    
    // Verify the token
    try {
      const auth = getAuth();
      const decodedToken = await auth.verifyIdToken(idToken);
      
      console.log(`Authentication successful for user: ${decodedToken.uid}`);
      
      // Set the user on the request object
      req.user = {
        id: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || '',
        picture: decodedToken.picture || ''
      };
      
      return next();
    } catch (tokenError) {
      console.error("Token verification error:", tokenError.message);
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
  } catch (error) {
    console.error("Authentication error:", error.message);
    return res.status(500).json({ message: "Server error during authentication" });
  }
};

module.exports = {
  isAuthenticated
}; 