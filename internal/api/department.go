package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/services"
)

type DepartmentHandler struct {
	service *services.DepartmentService
}

func NewDepartmentHandler(service *services.DepartmentService) *DepartmentHandler {
	return &DepartmentHandler{service: service}
}

func (h *DepartmentHandler) GetAll(c *fiber.Ctx) error {
	summary, err := h.service.ListAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(summary)
}

func (h *DepartmentHandler) Create(c *fiber.Ctx) error {
	var department models.Department
	if err := c.BodyParser(&department); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	err := h.service.Create(&department)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.Status(fiber.StatusCreated).JSON("sucessful")
}

func (h *DepartmentHandler) Update(c *fiber.Ctx) error {
	// id := c.Params("id")
	var department models.Department
	if err := c.BodyParser(&department); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	err := h.service.Update(&department)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON("success")
}
