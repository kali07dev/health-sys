package api

import (
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/schema"
	"github.com/hopkali04/health-sys/internal/services/user"
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
	// Generate JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userID": user.ID,
		"role":   "employee",
		"exp":    time.Now().Add(24 * time.Hour).Unix(),
	})
	tokenString, err := token.SignedString([]byte("your-secret-key"))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	// Set HTTP-only cookie
	c.Cookie(&fiber.Cookie{
		Name:     "auth-token",
		Value:    tokenString,
		HTTPOnly: true,
		Secure:   false, // Use 'true' in production (requires HTTPS)
		SameSite: "Lax",
		Expires:  time.Now().Add(24 * time.Hour),
	})

	// Return user data (without sensitive fields)
	return c.JSON(fiber.Map{
		"user": fiber.Map{
			"id":    user.ID,
			"email": user.Email,
			"role":  "employee",
		},
		"token": tokenString,
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
