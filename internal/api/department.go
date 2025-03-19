package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/services"
	"github.com/hopkali04/health-sys/internal/utils"
)

type DepartmentHandler struct {
	service *services.DepartmentService
}

func NewDepartmentHandler(service *services.DepartmentService) *DepartmentHandler {
	return &DepartmentHandler{service: service}
}

// GetAll retrieves all departments
func (h *DepartmentHandler) GetAll(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to fetch all departments", map[string]interface{}{
		"path": c.Path(),
	})

	summary, err := h.service.ListAll()
	if err != nil {
		utils.LogError("Failed to fetch departments", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	utils.LogInfo("Successfully retrieved all departments", map[string]interface{}{
		"count": len(summary),
	})
	return c.JSON(summary)
}

// Create creates a new department
func (h *DepartmentHandler) Create(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to create a department", map[string]interface{}{
		"path": c.Path(),
	})

	var department models.Department
	if err := c.BodyParser(&department); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	utils.LogDebug("Creating department", map[string]interface{}{
		"department": department,
	})

	err := h.service.Create(&department)
	if err != nil {
		utils.LogError("Failed to create department", map[string]interface{}{
			"department": department,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	utils.LogInfo("Successfully created department", map[string]interface{}{
		"departmentID": department.ID,
	})
	return c.Status(fiber.StatusCreated).JSON("successful")
}

// Update updates an existing department
func (h *DepartmentHandler) Update(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to update a department", map[string]interface{}{
		"path": c.Path(),
	})

	var department models.Department
	if err := c.BodyParser(&department); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	utils.LogDebug("Updating department", map[string]interface{}{
		"department": department,
	})

	err := h.service.Update(&department)
	if err != nil {
		utils.LogError("Failed to update department", map[string]interface{}{
			"department": department,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	utils.LogInfo("Successfully updated department", map[string]interface{}{
		"departmentID": department.ID,
	})
	return c.JSON("success")
}
