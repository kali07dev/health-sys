package api

import (
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/schema"
	"github.com/hopkali04/health-sys/internal/services/user"
	"github.com/hopkali04/health-sys/internal/validation"
)

type UserHandler struct {
	userService         *user.UserService
	verificationService *user.VerificationService
}

func NewUserHandler(userService *user.UserService, vc *user.VerificationService) *UserHandler {
	return &UserHandler{
		userService:         userService,
		verificationService: vc,
	}
}

// Request body structs
type VerifyAccountRequest struct {
    Token string `json:"token" validate:"required"`
}

type RequestPasswordResetRequest struct {
    Email string `json:"email" validate:"required,email"`
}

type CompletePasswordResetRequest struct {
    Token       string `json:"token" validate:"required"`
    Password    string `json:"password" validate:"required,min=8"`
    ConfirmPassword string `json:"confirmPassword" validate:"required,eqfield=Password"`
}

// VerifyAccount handles account verification via email token
func (app *UserHandler) VerifyAccount(c *fiber.Ctx) error {
    var req VerifyAccountRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Invalid request body",
        })
    }

    // Validate request
    if err := validation.ParseAndValidate(c, &req); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Invalid request data",
            "details": err.Error(),
        })
    }

    // Verify the account
    err := app.verificationService.VerifyAccount(req.Token)
    if err != nil {
        switch err.Error() {
        case "invalid verification token":
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
                "error": "Invalid or expired verification token",
            })
        case "verification token expired":
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
                "error": "Verification link has expired. Please request a new one.",
            })
        default:
            return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
                "error": "Failed to verify account",
            })
        }
    }

    return c.Status(fiber.StatusOK).JSON(fiber.Map{
        "message": "Account verified successfully",
    })
}
// RequestPasswordReset initiates the password reset process
func (app *UserHandler) RequestPasswordReset(c *fiber.Ctx) error {
    var req RequestPasswordResetRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Invalid request body",
        })
    }

    // Validate request
    if err := validation.ParseAndValidate(c, &req); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Invalid request data",
            "details": err.Error(),
        })
    }

    // Check if email exists
    emailExists, err := app.userService.CheckEmailExists(req.Email)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to process request",
        })
    }

    if !emailExists {
        // Return success even if email doesn't exist (security best practice)
        return c.Status(fiber.StatusOK).JSON(fiber.Map{
            "message": "If an account exists with this email, you will receive password reset instructions.",
        })
    }

    // Initiate password reset
    err = app.verificationService.InitiatePasswordReset(req.Email)
    if err != nil {
        // Log the error but don't expose it to the client
        log.Printf("Failed to initiate password reset for email %s: %v", req.Email, err)
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to process password reset request",
        })
    }

    return c.Status(fiber.StatusOK).JSON(fiber.Map{
        "message": "If an account exists with this email, you will receive password reset instructions.",
    })
}

// CompletePasswordReset handles the password reset completion
func (app *UserHandler) CompletePasswordReset(c *fiber.Ctx) error {
    var req CompletePasswordResetRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Invalid request body",
        })
    }

    // Validate request
    if err := validation.ParseAndValidate(c, &req); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Invalid request data",
            "details": err.Error(),
        })
    }

    // Complete the password reset
    err := app.verificationService.CompletePasswordReset(req.Token, req.Password)
    if err != nil {
        switch err.Error() {
        case "invalid reset token":
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
                "error": "Invalid or expired reset token",
            })
        case "reset token expired":
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
                "error": "Password reset link has expired. Please request a new one.",
            })
        default:
            return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
                "error": "Failed to reset password",
            })
        }
    }

    // Clear any existing sessions/cookies for this user
    c.Cookie(&fiber.Cookie{
        Name:     "auth-token",
        Value:    "",
        HTTPOnly: true,
        Secure:   true,
        SameSite: "Lax",
        Expires:  time.Now().Add(-24 * time.Hour), // Expire immediately
        Path:     "/",
    })

    return c.Status(fiber.StatusOK).JSON(fiber.Map{
        "message": "Password has been reset successfully. Please log in with your new password.",
    })
}
func (app *UserHandler) Getall(ctx *fiber.Ctx) error {
	data, err := app.userService.GetallUsers()
	if err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Users not found",
		})
	}
	return ctx.JSON(data)
}
func (app *UserHandler) RegisterUser(ctx *fiber.Ctx) error {
	var user schema.UserRequest
	err := ctx.BodyParser(&user)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}
	if err := validation.ParseAndValidate(ctx, &user); err != nil {
		return err // Error response is already handled
	}

	emailExists, err := app.userService.CheckEmailExists(user.Email)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err,
		})
	}

	if emailExists {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email ALready In Use By another User",
		})
	}

	if err := app.userService.CreateUser(&user); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusCreated).JSON(user)
}
func (app *UserHandler) RegisterUserWithEmployeeAcc(ctx *fiber.Ctx) error {
	var user schema.CreateUserWithEmployeeRequest

	// This will now return immediately if validation fails
	if err := validation.ParseAndValidate(ctx, &user); err != nil {
		// The error response is already handled by ParseAndValidate
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err,
		})
	}

	// Only proceed if validation passes
	emailExists, err := app.userService.CheckEmailExists(user.Email)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	if emailExists {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email Already In Use By Another User",
		})
	}

	if err := app.userService.CreateUserWithEmployee(&user); err != nil {
	    return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
	        "error": err.Error(),
	    })
	}

	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "User Created Successfully!",
	})
}

func (app *UserHandler) BulkRegisterUsers(ctx *fiber.Ctx) error {
	var user []schema.UserRequest
	err := ctx.BodyParser(&user)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	for _, userDetails := range user {
		emailExists, err := app.userService.CheckEmailExists(userDetails.Email)
		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err,
			})
		}
		if emailExists {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Email ALready In Use By another User",
				"email": userDetails.Email,
			})
		}
		if err := validation.ParseAndValidate(ctx, &user); err != nil {
			return err // Error response is already handled
		}

	}

	if err := app.userService.BulkCreateUsers(user); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusCreated).JSON(user)
}
func (app *UserHandler) BulkRegisterUsersWithEmployeeAcc(ctx *fiber.Ctx) error {
	var user []schema.CreateUserWithEmployeeRequest
	err := ctx.BodyParser(&user)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	for _, userDetails := range user {
		emailExists, err := app.userService.CheckEmailExists(userDetails.Email)
		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err,
			})
		}
		if emailExists {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Email ALready In Use By another User",
				"email": userDetails.Email,
			})
		}

	}

	if err := app.userService.BulkCreateUsersWithEmployees(user); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusCreated).JSON("User Created Successfully!")
}

func (app *UserHandler) LoginUser(c *fiber.Ctx) error {
	var RequestData schema.UserLoginRequest

	if err := c.BodyParser(&RequestData); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	user, err := app.userService.GetUserByEmail(RequestData.Email)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid Email",
		})
	}

	// Check if account is verified
	if !user.IsVerified {
		// Resend verification email
		if err := app.verificationService.SendVerificationEmail(user); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to send verification email",
			})
		}
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Account not verified. A new verification email has been sent.",
		})
	}

	// Check if password needs to be set (for bulk-created accounts)
	if user.PasswordHash == "" {
		if err := app.verificationService.SendVerificationEmail(user); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to send password setup email",
			})
		}
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Please check your email to set up your password.",
		})
	}

	user, err = app.userService.Login(&RequestData)
	log.Println(err)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid credentials",
			"ddetails": err.Error(),
		})
	}

	role, err := app.userService.GetUserRole(user.ID)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Employee Account Not Found, Contact System Support",
		})
	}

	Response := schema.UserResponse{
		Email:             user.Email,
		ID:                user.ID.String(),
		LastLoginAt:       user.LastLoginAt,
		PasswordChangedAt: user.PasswordChangedAt,
		CreatedAt:         user.CreatedAt,
		UpdatedAt:         user.UpdatedAt,
	}

	// Set backend token expiration to 12 hours (longer than frontend)
	expirationTime := time.Now().Add(12 * time.Hour)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userID": Response.ID,
		"role":   role,
		"exp":    expirationTime.Unix(),
	})

	tokenString, err := token.SignedString([]byte("your-secret-key"))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	// Set HTTP-only cookie with same expiration
	c.Cookie(&fiber.Cookie{
		Name:     "auth-token",
		Value:    tokenString,
		HTTPOnly: true,
		Secure:   true, // Enable for production
		SameSite: "Lax",
		Expires:  expirationTime,
		Path:     "/",
	})

	return c.JSON(fiber.Map{
		"user": fiber.Map{
			"id":    Response.ID,
			"email": Response.Email,
			"role":  role,
		},
		"token":     tokenString,
		"expiresAt": expirationTime,
	})
}
func (app *UserHandler) LogoutUser(c *fiber.Ctx) error {
	// Clear the auth cookie
	c.Cookie(&fiber.Cookie{
		Name:     "auth-token",
		Value:    "",
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
		Expires:  time.Now().Add(-24 * time.Hour), // Expire immediately
		Path:     "/",
	})

	return c.JSON(fiber.Map{
		"message": "Logged out successfully",
	})
}
func (app *UserHandler) GetUser(c *fiber.Ctx) error {
	id := c.Params("id")
	parsedUUID, err := uuid.Parse(id)
	if err != nil {
		log.Printf("Invalid UUID format received: %s - Error: %v", id, err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid user ID format",
			"details": "The provided ID is not a valid UUID",
		})
	}
	// user, err := app.userService.GetUserByID(uuid.MustParse(id))
	user, err := app.userService.GetUserByID(parsedUUID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}
	return c.JSON(user)
}

func (app *UserHandler) UpdateUserPassword(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	var user schema.ChangePasswordReq
	err := ctx.BodyParser(&user)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	UserID := uuid.MustParse(id)
	emailExists, err := app.userService.CheckEmailExists(user.Email)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err,
		})
	}

	if !emailExists {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email Does not exist",
		})
	}
	err = app.userService.ChangePassword(UserID, user.ConfirmPassword)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.JSON(user)
}

func (h *UserHandler) DeleteUser(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.userService.DeleteUser(uuid.MustParse(id)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// UpdateUserRole updates a user's role
func (h *UserHandler) UpdateUserRole(c *fiber.Ctx) error {
	// Get user ID from URL parameter
	userIDStr := c.Params("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID format",
		})
	}

	// Parse request body
	var req schema.UpdateUserRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body: " + err.Error(),
		})
	}

	// Call service method
	err = h.userService.UpdateUserRole(userID, req.Role)
	if err != nil {
		statusCode := fiber.StatusInternalServerError
		if err.Error() == "invalid role: "+req.Role || err.Error() == "employee not found for user ID: "+userID.String() {
			statusCode = fiber.StatusBadRequest
		}
		return c.Status(statusCode).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "User role updated successfully",
	})
}

// UpdateUser updates user and employee information
func (h *UserHandler) UpdateUser(c *fiber.Ctx) error {
	// Get user ID from URL parameter
	userIDStr := c.Params("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID format",
		})
	}

	// Parse request body
	var req schema.UserUpdateData
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body: " + err.Error(),
		})
	}

	// Call service method
	err = h.userService.UpdateUser(userID, req)
	if err != nil {
		statusCode := fiber.StatusInternalServerError
		if err.Error() == "employee not found for user ID: "+userID.String() {
			statusCode = fiber.StatusBadRequest
		}
		return c.Status(statusCode).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "User information updated successfully",
	})
}

// UpdateUserStatus updates a user's active status
func (h *UserHandler) UpdateUserStatus(c *fiber.Ctx) error {
	// Get user ID from URL parameter
	userIDStr := c.Params("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID format",
		})
	}

	// Parse request body
	var req schema.UpdateUserStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body: " + err.Error(),
		})
	}

	// Call service method
	err = h.userService.UpdateUserStatus(userID, req.IsActive)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "User status updated successfully",
	})
}