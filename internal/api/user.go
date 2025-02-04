package api

import (
	"github.com/gofiber/fiber/v2"
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

func (app *UserHandler) Getall(ctx *fiber.Ctx) error{
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

	return c.JSON(user)
}

func (app *UserHandler) GetUser(c *fiber.Ctx) error {
	id := c.Params("id")
	user, err := app.userService.GetUserByID(uuid.MustParse(id))
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
