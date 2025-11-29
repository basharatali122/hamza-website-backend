import express from "express";
import { 
  getTeamOverview, 
  getTeamTree, 
  getTeamList 
} from "../controller/team.controller.js";
import authenticate  from "../middlewares/auth.middlware.js";

const router = express.Router();

router.get("/overview", authenticate, getTeamOverview);
router.get("/tree", authenticate, getTeamTree);
router.get("/list", authenticate, getTeamList);

export default router;