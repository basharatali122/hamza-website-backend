export const adminCheck = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized. Login required." });
    }
    if (req.user.role?.toLowerCase() === "admin" || req.user.role?.toLowerCase() === "vendor") {
      return next();
    }
    return res.status(403).json({ message: "Access denied. Admins only." });
  } catch (error) {
    console.error("Admin Check Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const newCheck = (req, res) => {
  return console.log("new");
};