const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  // Step 1: Read Authorization header
  // Format should be: "Bearer eyJhbGci..."
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized — no token provided",
    });
  }

  // Step 2: Extract just the token part (after "Bearer ")
  const token = authHeader.split(" ")[1];

  try {
    // Step 3: Verify + decode token using our secret key
    // If expired or tampered → throws JsonWebTokenError → caught below
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Step 4: Attach decoded payload to request
    // decoded = { id: "...", email: "...", name: "...", iat: ..., exp: ... }
    req.user = decoded;

    // Step 5: Pass control to the actual route handler
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired — please login again" });
    }
    return res.status(401).json({ success: false, message: "Unauthorized — invalid token" });
  }
};

module.exports = protect;