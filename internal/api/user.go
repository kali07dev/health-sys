package api

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/schema"
	"github.com/hopkali04/health-sys/internal/services/user"
	"github.com/hopkali04/health-sys/internal/utils"
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
	Token           string `json:"token" validate:"required"`
	Password        string `json:"password" validate:"required,min=8"`
	ConfirmPassword string `json:"confirmPassword" validate:"required,eqfield=Password"`
}

// VerifyAccount handles account verification via email token
func (app *UserHandler) VerifyAccount(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to verify account", map[string]interface{}{
		"path": c.Path(),
	})

	var req VerifyAccountRequest
	if err := c.BodyParser(&req); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if err := validation.ParseAndValidate(c, &req); err != nil {
		utils.LogError("Invalid request data", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request data", "details": err.Error()})
	}

	utils.LogDebug("Verifying account", map[string]interface{}{
		"token": req.Token,
	})

	err := app.verificationService.VerifyAccount(req.Token)
	if err != nil {
		switch err.Error() {
		case "invalid verification token":
			utils.LogError("Invalid or expired verification token", map[string]interface{}{
				"token": req.Token,
			})
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid or expired verification token"})
		case "verification token expired":
			utils.LogError("Verification token expired", map[string]interface{}{
				"token": req.Token,
			})
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Verification link has expired. Please request a new one."})
		default:
			utils.LogError("Failed to verify account", map[string]interface{}{
				"token": req.Token,
				"error": err.Error(),
			})
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to verify account"})
		}
	}

	utils.LogInfo("Successfully verified account", map[string]interface{}{
		"token": req.Token,
	})
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Account verified successfully"})
}

// RequestPasswordReset initiates the password reset process
func (app *UserHandler) RequestPasswordReset(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to initiate password reset", map[string]interface{}{
		"path": c.Path(),
	})

	var req RequestPasswordResetRequest
	if err := c.BodyParser(&req); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if err := validation.ParseAndValidate(c, &req); err != nil {
		utils.LogError("Invalid request data", map[string]interface{}{
			"email": req.Email,
			"error": err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request data", "details": err.Error()})
	}

	emailExists, err := app.userService.CheckEmailExists(req.Email)
	if err != nil {
		utils.LogError("Failed to check if email exists", map[string]interface{}{
			"email": req.Email,
			"error": err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to process request"})
	}

	if emailExists {
		utils.LogDebug("Initiating password reset", map[string]interface{}{
			"email": req.Email,
		})

		if err := app.verificationService.InitiatePasswordReset(req.Email); err != nil {
			utils.LogError("Failed to initiate password reset", map[string]interface{}{
				"email": req.Email,
				"error": err.Error(),
			})
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to process password reset request"})
		}
	}

	utils.LogInfo("Successfully initiated password reset", map[string]interface{}{
		"email": req.Email,
	})
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "If an account exists with this email, you will receive password reset instructions."})
}

// CompletePasswordReset handles the password reset completion
func (app *UserHandler) CompletePasswordReset(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to complete password reset", map[string]interface{}{
		"path": c.Path(),
	})

	var req CompletePasswordResetRequest
	if err := c.BodyParser(&req); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if err := validation.ParseAndValidate(c, &req); err != nil {
		utils.LogError("Invalid request data", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request data", "details": err.Error()})
	}

	utils.LogDebug("Completing password reset", map[string]interface{}{
		"token": req.Token,
	})

	err := app.verificationService.CompletePasswordReset(req.Token, req.Password)
	if err != nil {
		switch err.Error() {
		case "invalid reset token":
			utils.LogError("Invalid or expired reset token", map[string]interface{}{
				"token": req.Token,
			})
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid or expired reset token"})
		case "reset token expired":
			utils.LogError("Reset token expired", map[string]interface{}{
				"token": req.Token,
			})
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Password reset link has expired. Please request a new one."})
		default:
			utils.LogError("Failed to reset password", map[string]interface{}{
				"token": req.Token,
				"error": err.Error(),
			})
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to reset password"})
		}
	}

	utils.LogInfo("Successfully completed password reset", map[string]interface{}{
		"token": req.Token,
	})

	c.Cookie(&fiber.Cookie{
		Name:     "auth-token",
		Value:    "",
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
		Expires:  time.Now().Add(-24 * time.Hour),
		Path:     "/",
	})

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Password has been reset successfully. Please log in with your new password."})
}

// Getall retrieves all users
func (app *UserHandler) Getall(ctx *fiber.Ctx) error {
	utils.LogInfo("Processing request to fetch all users", map[string]interface{}{
		"path": ctx.Path(),
	})

	data, err := app.userService.GetallUsers()
	if err != nil {
		utils.LogError("Failed to fetch users", map[string]interface{}{
			"error": err.Error(),
		})
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Users not found"})
	}

	utils.LogInfo("Successfully retrieved all users", map[string]interface{}{
		"count": len(data),
	})
	return ctx.JSON(data)
}

// RegisterUser registers a new user
func (app *UserHandler) RegisterUser(ctx *fiber.Ctx) error {
	utils.LogInfo("Processing request to register a user", map[string]interface{}{
		"path": ctx.Path(),
	})

	var user schema.UserRequest
	if err := ctx.BodyParser(&user); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if err := validation.ParseAndValidate(ctx, &user); err != nil {
		utils.LogError("Invalid request data", map[string]interface{}{
			"error": err.Error(),
		})
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request data", "details": err.Error()})
	}

	emailExists, err := app.userService.CheckEmailExists(user.Email)
	if err != nil {
		utils.LogError("Failed to check if email exists", map[string]interface{}{
			"email": user.Email,
			"error": err.Error(),
		})
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	if emailExists {
		utils.LogError("Email already in use", map[string]interface{}{
			"email": user.Email,
		})
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email Already In Use By Another User"})
	}

	if err := app.userService.CreateUser(&user); err != nil {
		utils.LogError("Failed to create user", map[string]interface{}{
			"email": user.Email,
			"error": err.Error(),
		})
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully registered user", map[string]interface{}{
		"email": user.Email,
	})
	return ctx.Status(fiber.StatusCreated).JSON(user)
}
func (app *UserHandler) RegisterUserWithEmployeeAcc(ctx *fiber.Ctx) error {
	utils.LogInfo("Processing request to register a user with employee account", map[string]interface{}{
		"path": ctx.Path(),
	})

	var user schema.CreateUserWithEmployeeRequest

	err := ctx.BodyParser(&user)
	if err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	emailExists, err := app.userService.CheckEmailExists(user.Email)
	if err != nil {
		utils.LogError("Failed to check if email exists", map[string]interface{}{
			"email": user.Email,
			"error": err.Error(),
		})
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	if emailExists {
		utils.LogError("Email already in use", map[string]interface{}{
			"email": user.Email,
		})
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email Already In Use By Another User"})
	}

	if err := app.userService.CreateUserWithEmployee(&user); err != nil {
		utils.LogError("Failed to create user with employee account", map[string]interface{}{
			"email": user.Email,
			"error": err.Error(),
		})
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully registered user with employee account", map[string]interface{}{
		"email": user.Email,
	})
	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "User Created Successfully!"})
}

func (app *UserHandler) BulkRegisterUsers(ctx *fiber.Ctx) error {
	utils.LogInfo("Processing request to bulk register users", map[string]interface{}{
		"path": ctx.Path(),
	})

	var users []schema.UserRequest
	err := ctx.BodyParser(&users)
	if err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	for _, userDetails := range users {
		emailExists, err := app.userService.CheckEmailExists(userDetails.Email)
		if err != nil {
			utils.LogError("Failed to check if email exists", map[string]interface{}{
				"email": userDetails.Email,
				"error": err.Error(),
			})
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		if emailExists {
			utils.LogError("Email already in use", map[string]interface{}{
				"email": userDetails.Email,
			})
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email Already In Use By Another User"})
		}

		if err := validation.ParseAndValidate(ctx, &userDetails); err != nil {
			utils.LogError("Invalid request data", map[string]interface{}{
				"email": userDetails.Email,
				"error": err.Error(),
			})
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request data", "details": err.Error()})
		}
	}

	if err := app.userService.BulkCreateUsers(users); err != nil {
		utils.LogError("Failed to bulk create users", map[string]interface{}{
			"error": err.Error(),
		})
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully bulk registered users", map[string]interface{}{
		"count": len(users),
	})
	return ctx.Status(fiber.StatusCreated).JSON(users)
}

func (app *UserHandler) BulkRegisterUsersWithEmployeeAcc(ctx *fiber.Ctx) error {
	utils.LogInfo("Processing request to bulk register users with employee accounts", map[string]interface{}{
		"path": ctx.Path(),
	})

	var users []schema.CreateUserWithEmployeeRequest
	err := ctx.BodyParser(&users)
	if err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	for _, userDetails := range users {
		emailExists, err := app.userService.CheckEmailExists(userDetails.Email)
		if err != nil {
			utils.LogError("Failed to check if email exists", map[string]interface{}{
				"email": userDetails.Email,
				"error": err.Error(),
			})
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		if emailExists {
			utils.LogError("Email already in use", map[string]interface{}{
				"email": userDetails.Email,
			})
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email Already In Use By Another User"})
		}
	}

	if err := app.userService.BulkCreateUsersWithEmployees(users); err != nil {
		utils.LogError("Failed to bulk create users with employee accounts", map[string]interface{}{
			"error": err.Error(),
		})
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully bulk registered users with employee accounts", map[string]interface{}{
		"count": len(users),
	})
	return ctx.Status(fiber.StatusCreated).JSON("User Created Successfully!")
}

func (app *UserHandler) LoginUser(c *fiber.Ctx) error {
	utils.LogInfo("Processing login request", map[string]interface{}{
		"path": c.Path(),
	})

	var requestData schema.UserLoginRequest
	if err := c.BodyParser(&requestData); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	user, err := app.userService.GetUserByEmail(requestData.Email)
	if err != nil {
		utils.LogError("Failed to find user by email", map[string]interface{}{
			"email": requestData.Email,
			"error": err.Error(),
		})
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid Email"})
	}

	if !user.IsVerified {
		if err := app.verificationService.SendVerificationEmail(user); err != nil {
			utils.LogError("Failed to send verification email", map[string]interface{}{
				"email": requestData.Email,
				"error": err.Error(),
			})
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to send verification email"})
		}
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Account not verified. A new verification email has been sent."})
	}

	if user.PasswordHash == "" {
		if err := app.verificationService.SendVerificationEmail(user); err != nil {
			utils.LogError("Failed to send password setup email", map[string]interface{}{
				"email": requestData.Email,
				"error": err.Error(),
			})
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to send password setup email"})
		}
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Please check your email to set up your password."})
	}

	user, err = app.userService.Login(&requestData)
	if err != nil {
		utils.LogError("Failed to authenticate user", map[string]interface{}{
			"email": requestData.Email,
			"error": err.Error(),
		})
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	role, err := app.userService.GetUserRole(user.ID)
	if err != nil {
		utils.LogError("Failed to fetch user role", map[string]interface{}{
			"userID": user.ID,
			"error":  err.Error(),
		})
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Employee Account Not Found, Contact System Support"})
	}

	response := schema.UserResponse{
		Email:             user.Email,
		ID:                user.ID.String(),
		LastLoginAt:       user.LastLoginAt,
		PasswordChangedAt: user.PasswordChangedAt,
		CreatedAt:         user.CreatedAt,
		UpdatedAt:         user.UpdatedAt,
	}

	expirationTime := time.Now().Add(12 * time.Hour)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userID": response.ID,
		"role":   role,
		"exp":    expirationTime.Unix(),
	})

	tokenString, err := token.SignedString([]byte("your-secret-key"))
	if err != nil {
		utils.LogError("Failed to generate JWT token", map[string]interface{}{
			"userID": response.ID,
			"error":  err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	c.Cookie(&fiber.Cookie{
		Name:     "auth-token",
		Value:    tokenString,
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
		Expires:  expirationTime,
		Path:     "/",
	})

	utils.LogInfo("User logged in successfully", map[string]interface{}{
		"userID": response.ID,
		"email":  response.Email,
		"role":   role,
	})
	return c.JSON(fiber.Map{
		"user": fiber.Map{
			"id":    response.ID,
			"email": response.Email,
			"role":  role,
		},
		"token":     tokenString,
		"expiresAt": expirationTime,
	})
}

func (app *UserHandler) LogoutUser(c *fiber.Ctx) error {
	utils.LogInfo("Processing logout request", map[string]interface{}{
		"path": c.Path(),
	})

	c.Cookie(&fiber.Cookie{
		Name:     "auth-token",
		Value:    "",
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
		Expires:  time.Now().Add(-24 * time.Hour),
		Path:     "/",
	})

	utils.LogInfo("User logged out successfully", map[string]interface{}{})
	return c.JSON(fiber.Map{"message": "Logged out successfully"})
}

func (app *UserHandler) GetUser(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to fetch user by ID", map[string]interface{}{
		"path": c.Path(),
	})

	id := c.Params("id")
	parsedUUID, err := uuid.Parse(id)
	if err != nil {
		utils.LogError("Invalid UUID format received", map[string]interface{}{
			"id":    id,
			"error": err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid user ID format",
			"details": "The provided ID is not a valid UUID",
		})
	}

	user, err := app.userService.GetUserByID(parsedUUID)
	if err != nil {
		utils.LogError("Failed to fetch user by ID", map[string]interface{}{
			"userID": id,
			"error":  err.Error(),
		})
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}

	utils.LogInfo("Successfully retrieved user by ID", map[string]interface{}{
		"userID": id,
	})
	return c.JSON(user)
}

func (app *UserHandler) UpdateUserPassword(ctx *fiber.Ctx) error {
	utils.LogInfo("Processing request to update user password", map[string]interface{}{
		"path": ctx.Path(),
	})

	id := ctx.Params("id")
	var user schema.ChangePasswordReq
	err := ctx.BodyParser(&user)
	if err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	UserID := uuid.MustParse(id)
	emailExists, err := app.userService.CheckEmailExists(user.Email)
	if err != nil {
		utils.LogError("Failed to check if email exists", map[string]interface{}{
			"email": user.Email,
			"error": err.Error(),
		})
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if !emailExists {
		utils.LogError("Email does not exist", map[string]interface{}{
			"email": user.Email,
		})
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email Does not exist"})
	}

	err = app.userService.ChangePassword(UserID, user.ConfirmPassword)
	if err != nil {
		utils.LogError("Failed to change user password", map[string]interface{}{
			"userID": UserID,
			"error":  err.Error(),
		})
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully updated user password", map[string]interface{}{
		"userID": UserID,
		"email":  user.Email,
	})
	return ctx.JSON(user)
}

func (h *UserHandler) DeleteUser(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to delete user", map[string]interface{}{
		"path": c.Path(),
	})

	id := c.Params("id")
	userID := uuid.MustParse(id)

	err := h.userService.DeleteUser(userID)
	if err != nil {
		utils.LogError("Failed to delete user", map[string]interface{}{
			"userID": userID,
			"error":  err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully deleted user", map[string]interface{}{
		"userID": userID,
	})
	return c.SendStatus(fiber.StatusNoContent)
}

// UpdateUserRole updates a user's role
func (h *UserHandler) UpdateUserRole(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to update user role", map[string]interface{}{
		"path": c.Path(),
	})

	// Get user ID from URL parameter
	userIDStr := c.Params("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		utils.LogError("Invalid user ID format", map[string]interface{}{
			"userID": userIDStr,
			"error":  err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID format"})
	}

	// Parse request body
	var req schema.UpdateUserRoleRequest
	if err := c.BodyParser(&req); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"userID": userID,
			"error":  err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body: " + err.Error()})
	}

	// Call service method
	err = h.userService.UpdateUserRole(userID, req.Role)
	if err != nil {
		statusCode := fiber.StatusInternalServerError
		utils.LogError("Failed to update user role", map[string]interface{}{
			"userID": userID,
			"role":   req.Role,
			"error":  err.Error(),
		})
		if err.Error() == "invalid role: "+req.Role || err.Error() == "employee not found for user ID: "+userID.String() {
			statusCode = fiber.StatusBadRequest
		}
		return c.Status(statusCode).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully updated user role", map[string]interface{}{
		"userID": userID,
		"role":   req.Role,
	})
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "User role updated successfully"})
}

// UpdateUser updates user and employee information
func (h *UserHandler) UpdateUser(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to update user information", map[string]interface{}{
		"path": c.Path(),
	})

	// Get user ID from URL parameter
	userIDStr := c.Params("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		utils.LogError("Invalid user ID format", map[string]interface{}{
			"userID": userIDStr,
			"error":  err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID format"})
	}

	// Parse request body
	var req schema.UserUpdateData
	if err := c.BodyParser(&req); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"userID": userID,
			"error":  err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body: " + err.Error()})
	}

	// Call service method
	err = h.userService.UpdateUser(userID, req)
	if err != nil {
		statusCode := fiber.StatusInternalServerError
		utils.LogError("Failed to update user information", map[string]interface{}{
			"userID": userID,
			"error":  err.Error(),
		})
		if err.Error() == "employee not found for user ID: "+userID.String() {
			statusCode = fiber.StatusBadRequest
		}
		return c.Status(statusCode).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully updated user information", map[string]interface{}{
		"userID": userID,
	})
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "User information updated successfully"})
}

// UpdateUserStatus updates a user's active status
func (h *UserHandler) UpdateUserStatus(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to update user status", map[string]interface{}{
		"path": c.Path(),
	})

	// Get user ID from URL parameter
	userIDStr := c.Params("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		utils.LogError("Invalid user ID format", map[string]interface{}{
			"userID": userIDStr,
			"error":  err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID format"})
	}

	// Parse request body
	var req schema.UpdateUserStatusRequest
	if err := c.BodyParser(&req); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"userID": userID,
			"error":  err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body: " + err.Error()})
	}

	// Call service method
	err = h.userService.UpdateUserStatus(userID, req.IsActive)
	if err != nil {
		utils.LogError("Failed to update user status", map[string]interface{}{
			"userID":   userID,
			"isActive": req.IsActive,
			"error":    err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully updated user status", map[string]interface{}{
		"userID":   userID,
		"isActive": req.IsActive,
	})
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "User status updated successfully"})
}
