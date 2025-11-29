import { TeamService } from "../services/team.service.js";

export const getTeamOverview = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const teamStats = await TeamService.updateTeamStats(userId);
    const directTeam = await TeamService.getDirectTeam(userId);

    return res.json({
      success: true,
      teamStats,
      directTeam,
      summary: {
        totalTeamMembers: teamStats.teamSize,
        directReferrals: teamStats.directReferrals,
        teamDepth: teamStats.maxDepth
      }
    });
  } catch (error) {
    console.error("Get team overview error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getTeamTree = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { depth = 5 } = req.query;

    const teamTree = await TeamService.getFullTeamTree(userId, parseInt(depth));

    return res.json({
      success: true,
      teamTree
    });
  } catch (error) {
    console.error("Get team tree error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getTeamList = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const teamList = await TeamService.getTeamWithLevels(userId);
    
    // Group by level for frontend display
    const teamByLevels = {};
    teamList.forEach(member => {
      if (!teamByLevels[member.level]) {
        teamByLevels[member.level] = [];
      }
      teamByLevels[member.level].push(member);
    });

    return res.json({
      success: true,
      teamList,
      teamByLevels,
      totalMembers: teamList.length,
      levels: Object.keys(teamByLevels).length
    });
  } catch (error) {
    console.error("Get team list error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};