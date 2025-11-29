import User from "../models/Users.js";

const teamCache = new Map();

export class TeamService {
  
  // Get direct referrals (Level 1) - People who used user's code
  static async getDirectTeam(userId) {
    return await User.findAll({
      where: { referredBy: userId },
      attributes: ['userId', 'name', 'email', 'referralCode', 'referralCount', 'referralLevel', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
  }

  // Get complete team tree (Recursive) - All levels
  static async getFullTeamTree(userId, maxDepth = 10) {
    const user = await User.findByPk(userId, {
      attributes: ['userId', 'name', 'referralCode', 'teamSize', 'directReferrals', 'teamDepth']
    });

    if (!user) return null;

    const buildTeamTree = async (currentUserId, currentDepth = 0) => {
      if (currentDepth >= maxDepth) return null;

      const teamMembers = await User.findAll({
        where: { referredBy: currentUserId },
        attributes: ['userId', 'name', 'email', 'referralCode', 'referralCount', 'referralLevel', 'createdAt']
      });

      const teamWithSubteams = await Promise.all(
        teamMembers.map(async (member) => ({
          ...member.toJSON(),
          subTeam: await buildTeamTree(member.userId, currentDepth + 1),
          level: currentDepth + 1,
          isDirectReferral: currentDepth === 0 // First level are direct referrals
        }))
      );

      return teamWithSubteams;
    };

    const teamTree = await buildTeamTree(userId);
    
    return {
      user: user.toJSON(),
      team: teamTree,
      stats: {
        totalMembers: await this.calculateTotalTeamSize(userId),
        directReferrals: teamTree?.length || 0,
        maxDepth: await this.calculateTeamDepth(userId)
      }
    };
  }

  // Calculate total team size (recursive count)
  static async calculateTotalTeamSize(userId) {
    let total = 0;
    
    const countRecursive = async (currentUserId) => {
      const directMembers = await User.findAll({
        where: { referredBy: currentUserId },
        attributes: ['userId']
      });
      
      total += directMembers.length;
      
      for (const member of directMembers) {
        await countRecursive(member.userId);
      }
    };
    
    await countRecursive(userId);
    return total;
  }

  // Calculate team depth
  static async calculateTeamDepth(userId) {
    let maxDepth = 0;
    
    const findDepth = async (currentUserId, currentDepth = 0) => {
      maxDepth = Math.max(maxDepth, currentDepth);
      
      const directMembers = await User.findAll({
        where: { referredBy: currentUserId },
        attributes: ['userId']
      });
      
      for (const member of directMembers) {
        await findDepth(member.userId, currentDepth + 1);
      }
    };
    
    await findDepth(userId);
    return maxDepth;
  }

  // Get flattened team list with levels
  static async getTeamWithLevels(userId) {
    const getTeamRecursive = async (referrerId, level = 1) => {
      const referrals = await User.findAll({
        where: { referredBy: referrerId },
        attributes: ['userId', 'name', 'email', 'referralCode', 'referralCount', 'referralLevel', 'createdAt']
      });

      let result = referrals.map(user => ({
        ...user.toJSON(),
        level: level,
        joinDate: user.createdAt,
        isDirectReferral: level === 1
      }));

      // Get sub-referrals recursively
      for (let user of referrals) {
        const subReferrals = await getTeamRecursive(user.userId, level + 1);
        result = result.concat(subReferrals);
      }

      return result;
    };

    const teamList = await getTeamRecursive(userId);
    
    // Group by level for frontend display
    const teamByLevels = {};
    teamList.forEach(member => {
      if (!teamByLevels[member.level]) {
        teamByLevels[member.level] = [];
      }
      teamByLevels[member.level].push(member);
    });

    return {
      teamList,
      teamByLevels,
      totalMembers: teamList.length,
      levels: Object.keys(teamByLevels).length,
      directReferrals: teamByLevels[1]?.length || 0
    };
  }

  // Update team statistics
  static async updateTeamStats(userId) {
    const teamList = await this.getTeamWithLevels(userId);
    
    const directReferrals = teamList.teamList.filter(m => m.level === 1).length;
    const teamSize = teamList.teamList.length;
    const maxDepth = Math.max(...teamList.teamList.map(m => m.level), 0);

    await User.update({
      directReferrals,
      teamSize,
      teamDepth: maxDepth
    }, { where: { userId } });

    return { directReferrals, teamSize, maxDepth };
  }

  // Get team overview with both direct referrals and team stats
  static async getTeamOverview(userId) {
    const directTeam = await this.getDirectTeam(userId);
    const teamStats = await this.updateTeamStats(userId);
    const fullTeamList = await this.getTeamWithLevels(userId);

    return {
      teamStats,
      directTeam,
      fullTeamList: fullTeamList.teamList,
      summary: {
        totalTeamMembers: teamStats.teamSize,
        directReferrals: teamStats.directReferrals,
        teamDepth: teamStats.maxDepth,
        indirectReferrals: teamStats.teamSize - teamStats.directReferrals
      }
    };
  }
}