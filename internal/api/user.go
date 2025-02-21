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
	userService *user.UserService
}

func NewUserHandler(userService *user.UserService) *UserHandler {
	return &UserHandler{userService: userService}
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

	// if err := app.userService.CreateUserWithEmployee(&user); err != nil {
	//     return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
	//         "error": err.Error(),
	//     })
	// }

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

	user, err := app.userService.Login(&RequestData)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid credentials",
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
		"token": tokenString,
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
