import { Router } from "express";
const routes = Router();
import {
  Login,
  Logout,
  Register,
  LoginWithGoogle,
  googleCallback,
  LoginWithGithub,
  githubCallback,
} from "../controller/auth.controller.js";

import authMiddleware from "../middlewares/auth.middlware.js";
import { loginSchema, registerSchema } from "../validations/user.validation.js";
import validate from "../middlewares/validator.middleware.js";

routes.post("/login", validate(loginSchema), Login);
routes.post("/logout", Logout);
routes.post("/register", validate(registerSchema), Register);

// Google OAuth
routes.get("/google", LoginWithGoogle);
routes.get("/google/callback", googleCallback);

// GitHub OAuth
routes.get("/github", LoginWithGithub);
routes.get("/github/callback", githubCallback);

// Example of a protected route
routes.get("/me", authMiddleware, (req, res) => {
  res.json({ message: "Protected route accessed!", user: req.user });
});

export default routes;