import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_attendease_2026";

function extractToken(req) {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    return req.headers.authorization.split(" ")[1];
  }
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  if (req.body && req.body.token) {
    return req.body.token;
  }
  if (req.query && req.query.token) {
    return req.query.token;
  }
  return null;
}

export function verifyToken(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: "Access Denied: Authentication token required" });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function optionalToken(req, res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // Ignored for optional
    }
  }
  next();
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const role = (req.user.role || req.user.type || "").toLowerCase();
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      return res.status(403).json({ message: `Forbidden: Requires one of [${allowedRoles.join(", ")}] roles` });
    }
    next();
  };
}

export function generateToken(data, expiresIn = "7d") {
  return jwt.sign(data, JWT_SECRET, { expiresIn });
}

export function generateQrToken(sessionId, teacherEmail, expiresInSeconds = 60) {
  return jwt.sign(
    { sessionId, teacherEmail, purpose: "attendance_qr" },
    JWT_SECRET,
    { expiresIn: expiresInSeconds }
  );
}

export function verifyQrToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

const JWT = {
  verifyToken,
  optionalToken,
  requireRole,
  generateToken,
  generateQrToken,
  verifyQrToken,
  extractToken,
};

export default JWT;
