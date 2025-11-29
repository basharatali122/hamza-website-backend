import { Router } from "express";
import {
  getProfile,
  updateProfile,
  deleteProfile,
  changePassword,
  getAllUsers
} from "../controller/user.controller.js";
import authMiddleware from "../middlewares/auth.middlware.js";
import validate from "../middlewares/validator.middleware.js";
import {
  updateProfileSchema,
  changePasswordSchema,
} from "../validations/user.validation.js";

const routes = Router();

routes.get("/me", authMiddleware, getProfile);
routes.get("/all", getAllUsers);
routes.put("/update", authMiddleware, validate(updateProfileSchema), updateProfile);
routes.delete("/delete", authMiddleware, deleteProfile);
routes.put(
  "/change-password",
  authMiddleware,
  validate(changePasswordSchema),
  changePassword
);

export default routes;
