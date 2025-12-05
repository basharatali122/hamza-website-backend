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


// Add referral bonus on new user signup
 export const  addReferralBonus = async(referrerId, newUserId)=> {
  const t = await sequelize.transaction();
  
  try {
    // Get referral settings
    const bonusPercentage = 5; // Or fetch from EventReferral settings
    const bonusAmount = 100; // Fixed signup bonus (PKR)
    
    // Get or create wallet for referrer
    let wallet = await Wallet.findOne({ 
      where: { user_id: referrerId },
      transaction: t 
    });
    
    if (!wallet) {
      wallet = await Wallet.create({ user_id: referrerId }, { transaction: t });
    }
    
    // Add bonus to wallet
    wallet.bonus_balance = parseFloat(wallet.bonus_balance) + bonusAmount;
    wallet.total_earned = parseFloat(wallet.total_earned) + bonusAmount;
    await wallet.save({ transaction: t });
    
    // Create transaction record
    await Transaction.create({
      user_id: referrerId,
      transaction_type: 'referral_bonus',
      amount: bonusAmount,
      payment_method: 'bonus',
      status: 'completed',
      transaction_id: `REF-${Date.now()}-${referrerId}`,
      description: `Referral bonus for inviting user #${newUserId}`,
      metadata: { referred_user_id: newUserId }
    }, { transaction: t });
    
    await t.commit();
    
    return {
      success: true,
      bonus_amount: bonusAmount
    };
    
  } catch (error) {
    await t.rollback();
    console.error('Add referral bonus error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
