import "dotenv/config";
import crypto from "crypto";
import { models } from "../models/index.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_KEY);
const { User, emailCheck } = models;

// Send verification email with both link + OTP
export const sendVerificationEmail = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Generate OTP code + token link
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save both in DB (we reuse token column for both)
    await emailCheck.upsert({
      userId: user.userId,
      token: code, // OTP stored here
      expiresAt,
      isVerified: false,
    });

    const verifyLink = `http://localhost:3000/api/auth/verify-email/${token}`;

    // Send email with Resend
    const response = await resend.emails.send({
      from: "onboarding@resend.dev", // ✅ sandbox sender or verified domain
      to: user.email,
      subject: "Verify your email",
      html: `
        <p>Hello ${user.name || "User"},</p>
        <p>You can verify your account using either method:</p>
        <ul>
          <li><strong>Option 1 (Recommended):</strong> Enter this code in the app: <h2>${code}</h2></li>
          <li><strong>Option 2:</strong> Click this link: <a href="${verifyLink}">${verifyLink}</a></li>
        </ul>
        <p>This code and link will expire in 15 minutes.</p>
      `,
    });

    console.log("📧 Resend response:", response);
    console.log("✅ Code sent:", code);
    console.log("✅ Link:", verifyLink);

    return res.json({ message: "Verification email sent" });
  } catch (err) {
    console.error("sendVerificationEmail Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Verify via OTP code
export const verifyEmailCode = async (req, res) => {
  try {
    const { code } = req.body;

    const record = await emailCheck.findOne({
      where: { token: code },
      include: { model: User, as: "user" },
    });

    if (!record) return res.status(400).json({ error: "Invalid or expired code" });
    if (record.expiresAt < new Date()) return res.status(400).json({ error: "Code expired" });

    record.isVerified = true;
    record.token = "USED_" + record.token;
    await record.save();

    return res.json({ message: "Email verified successfully!" });
  } catch (err) {
    console.error("verifyEmailCode Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Verify via clickable link
export const verifyEmailLink = async (req, res) => {
  try {
    const { token } = req.params;

    const record = await emailCheck.findOne({
      where: { token },
      include: { model: User, as: "user" },
    });

    if (!record) return res.status(400).send("Invalid or expired verification link");
    if (record.expiresAt < new Date()) return res.status(400).send("Verification link expired");

    record.isVerified = true;
    record.token = "USED_" + record.token;
    await record.save();

    return res.send("✅ Email verified successfully! You can close this tab.");
  } catch (err) {
    console.error("verifyEmailLink Error:", err);
    res.status(500).send("Internal server error");
  }
};