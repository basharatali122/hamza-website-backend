// controllers/referralController.js
import User from "../models/Users.js";
import ReferralEvent from "../models/EventReferral.js";

export const getReferralInfo = async (req, res) => {
  try {
    const userId = req.user.userId; // From JWT middleware
    
    const user = await User.findByPk(userId, {
      attributes: ['userId', 'name', 'referralCode', 'referralCount', 'referralLevel'],
      include: [{
        model: User,
        as: 'referrals',
        attributes: ['userId', 'name', 'email', 'createdAt']
      }]
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const referralLink = `${process.env.FRONTEND_URL}/signup?ref=${user.referralCode}`;

    return res.json({
      referralCode: user.referralCode,
      referralLink,
      referralCount: user.referralCount,
      referralLevel: user.referralLevel,
      referrals: user.referrals
    });
  } catch (error) {
    console.error("Get referral info error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getReferralAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const referralStats = await ReferralEvent.findAll({
      where: { referrerId: userId },
      include: [{
        model: User,
        as: 'referee',
        attributes: ['name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      totalReferrals: referralStats.length,
      referralHistory: referralStats
    });
  } catch (error) {
    console.error("Get referral analytics error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};