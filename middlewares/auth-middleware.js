const jwt = require("jsonwebtoken");
const User = require("../models/user-model");

// Middleware to protect routes
const protect  = async (req, res, next) => {
    try {
        let token = req.headers.authorization;
       
        
        if (token && token.startsWith('Bearer')){
            token = token.split(" ")[1]; // Extract the token from the header
            const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
            req.user = await User.findById(decoded.id).select("-password"); // Find the user and exclude the password field
            next(); // Call the next middleware or route handler
        } else{
            res.status(401).json({ message: "Not authorized, no token" }); // If no token is provided
        }
    } catch (error) {
        res.status(401).json({ message: "Not authorized, token failed", error: error.message }); 
    }
}

// Middleware for Admin-only access
const adminOnly = (req, res, next) => {
    if(req.user && req.user.role === 'admin'){
        next();
    }else {
        res.status(403).json({message: "Access denied, admin only"});
    
    }
}

module.exports = {
    protect,
    adminOnly
};