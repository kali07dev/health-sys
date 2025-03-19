package api

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/services"
	"github.com/hopkali04/health-sys/internal/utils"
)

type RoleHandler struct {
	roleService *services.RoleService
}

func NewRoleHandler(roleService *services.RoleService) *RoleHandler {
	return &RoleHandler{roleService: roleService}
}

// AssignRole handles assigning a role to an employee
func (h *RoleHandler) AssignRole(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to assign role", map[string]interface{}{
		"path":       c.Path(),
		"employeeID": c.Params("id"),
	})

	employeeID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		utils.LogError("Invalid employee ID format", map[string]interface{}{
			"employeeID": c.Params("id"),
			"error":      err.Error(),
		})
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid employee ID"})
	}

	var request struct {
		Role string `json:"role"`
	}
	if err := c.BodyParser(&request); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request payload"})
	}

	utils.LogDebug("Assigning role to employee", map[string]interface{}{
		"employeeID": employeeID,
		"role":       request.Role,
	})

	if err := h.roleService.AssignRole(c.Context(), employeeID, request.Role); err != nil {
		utils.LogError("Failed to assign role", map[string]interface{}{
			"employeeID": employeeID,
			"role":       request.Role,
			"error":      err.Error(),
		})
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully assigned role to employee", map[string]interface{}{
		"employeeID": employeeID,
		"role":       request.Role,
	})
	return c.Status(http.StatusOK).JSON(fiber.Map{"message": "Role assigned successfully"})
}
