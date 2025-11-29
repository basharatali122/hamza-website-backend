import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies?.auth || req.headers["authorization"]?.split(" ")[1]; 
    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.SECRET);

    // Ensure vendorId always exists (null if not vendor)
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      vendorId: decoded.vendorId ?? null,
    };

    next();
  } catch (err) {
    return res
      .status(401)
      .json({ error: "Invalid or expired token. Please login again." });
  }
};

export default authMiddleware;