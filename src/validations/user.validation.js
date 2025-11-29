import Joi from "joi";

const registerSchema = Joi.object({
  name: Joi.string()
    .pattern(/^[A-Za-z\s]+$/) // only letters + spaces
    .min(3)
    .max(50)
    .required()
    .messages({
      "string.empty": "Name is required",
      "string.min": "Name must be at least 3 characters",
      "string.max": "Name must be less than 50 characters",
      "string.pattern.base": "Name must only contain letters and spaces",
    }),

  username: Joi.string()
    .alphanum() // only letters + numbers
    .min(3)
    .max(30)
    .required()
    .messages({
      "string.alphanum": "Username can only contain letters and numbers",
      "string.min": "Username must be at least 3 characters",
      "string.max": "Username must be less than 30 characters",
    }),

  email: Joi.string()
    .email({ tlds: { allow: ["com", "net", "org", "io", "dev"] } }) // restrict to common domains
    .required()
    .messages({
      "string.email": "Email must be a valid email address",
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/[a-z]/) // at least one lowercase
    .pattern(/[A-Z]/) // at least one uppercase
    .pattern(/[0-9]/) // at least one digit
    .pattern(/[@$!%*?&#]/) // at least one special char
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters",
      "string.max": "Password must be less than 128 characters",
      "string.pattern.base":
        "Password must contain uppercase, lowercase, number, and special character",
    }),

  referralCode: Joi.string()
    .allow("", null)   // allow empty string or null
    .optional(),       // optional field

  role: Joi.string()
    .valid("admin", "customer", "vendor")
    .default("customer") // default role
    .messages({
      "any.only": "Role must be either admin, customer, or vendor",
    }),
});

const updateProfileSchema = Joi.object({
  name: Joi.string()
    .pattern(/^[A-Za-z\s]+$/) // only letters + spaces
    .min(3)
    .max(50)
    .optional()
    .messages({
      "string.min": "Name must be at least 3 characters",
      "string.max": "Name must be less than 50 characters",
      "string.pattern.base": "Name must only contain letters and spaces",
    }),

  email: Joi.string()
    .email({ tlds: { allow: false } }) // allow all domains, but must be valid format
    .optional()
    .messages({
      "string.email": "Email must be a valid email address",
    }),

  username: Joi.string()
    .alphanum() // only letters + numbers
    .min(3)
    .max(30)
    .optional()
    .messages({
      "string.alphanum": "Username can only contain letters and numbers",
      "string.min": "Username must be at least 3 characters",
      "string.max": "Username must be less than 30 characters",
    }),
}).min(1); 

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().min(8).max(128).required().messages({
    "string.min": "Old password must be at least 8 characters",
    "string.max": "Old password must be less than 128 characters",
  }),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/[a-z]/) // at least one lowercase
    .pattern(/[A-Z]/) // at least one uppercase
    .pattern(/[0-9]/) // at least one number
    .pattern(/[@$!%*?&#]/) // at least one special char
    .required()
    .messages({
      "string.min": "New password must be at least 8 characters",
      "string.max": "New password must be less than 128 characters",
      "string.pattern.base":
        "New password must contain uppercase, lowercase, number, and special character",
    }),
  confirmNewPassword: Joi.string()
    .required()
    .valid(Joi.ref("newPassword")) // must match newPassword
    .messages({
      "any.only": "Confirm password must match the new password",
      "string.empty": "Confirm password is required",
    }),
});

const loginSchema = Joi.object({
  username: Joi.string().min(3).max(50).required().messages({
    "string.empty": "Username is required",
    "string.min": "Username must be at least 3 characters",
    "string.max": "Username must be less than 50 characters",
  }),

  password: Joi.string().min(8).max(128).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters",
    "string.max": "Password must be less than 128 characters",
  }),
});

export {
  registerSchema,
  updateProfileSchema,
  changePasswordSchema,
  loginSchema,
};

export default {
  registerSchema,
  updateProfileSchema,
  changePasswordSchema,
  loginSchema,
};