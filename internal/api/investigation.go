package api

import (
	"net/http"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/schema"
	"github.com/hopkali04/health-sys/internal/services"
	"github.com/hopkali04/health-sys/internal/utils"
)

type InvestigationHandler struct {
	Service         *services.InvestigationService
	NotificationSVC *services.NotificationService
}

func NewInvestigationHandler(svc *services.InvestigationService, notifySVC *services.NotificationService) *InvestigationHandler {
	return &InvestigationHandler{
		Service:         svc,
		NotificationSVC: notifySVC,
	}
}

// GetAllByEmployeeID retrieves all investigations for a specific employee
func (h *InvestigationHandler) GetAllByEmployeeID(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to fetch investigations by employee ID", map[string]interface{}{
		"path":       c.Path(),
		"employeeID": c.Params("id"),
	})

	employeeID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		utils.LogError("Invalid employee ID format", map[string]interface{}{
			"employeeID": c.Params("id"),
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid employee ID"})
	}

	utils.LogDebug("Fetching employee details", map[string]interface{}{
		"employeeID": employeeID,
	})

	emp, err := h.Service.GetEmployeeByUserID(employeeID)
	if err != nil {
		utils.LogError("Failed to fetch employee details", map[string]interface{}{
			"employeeID": employeeID,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to check user existence", "details": err.Error()})
	}

	utils.LogDebug("Fetching investigations by employee ID", map[string]interface{}{
		"employeeID": emp.ID,
	})

	investigations, err := h.Service.GetAllByEmployeeID(emp.ID)
	if err != nil {
		utils.LogError("Failed to fetch investigations", map[string]interface{}{
			"employeeID": emp.ID,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve investigations"})
	}

	utils.LogInfo("Successfully retrieved investigations", map[string]interface{}{
		"employeeID": emp.ID,
		"count":      len(investigations),
	})

	response := schema.ConvertToInvestigationResponses(investigations)
	return c.Status(http.StatusOK).JSON(response)
}

// GetAll retrieves all investigations with optional filters
func (h *InvestigationHandler) GetAll(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to fetch all investigations", map[string]interface{}{
		"path":   c.Path(),
		"status": c.Query("status"),
		"limit":  c.Query("limit"),
		"offset": c.Query("offset"),
	})

	status := c.Query("status", "")
	limit, _ := strconv.Atoi(c.Query("limit", "0"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))

	utils.LogDebug("Fetching investigations with filters", map[string]interface{}{
		"status": status,
		"limit":  limit,
		"offset": offset,
	})

	investigations, err := h.Service.GetAll(status, limit, offset)
	if err != nil {
		utils.LogError("Failed to fetch investigations", map[string]interface{}{
			"status": status,
			"limit":  limit,
			"offset": offset,
			"error":  err.Error(),
		})
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully retrieved investigations", map[string]interface{}{
		"count": len(investigations),
	})

	response := schema.ConvertToInvestigationResponses(investigations)
	return c.Status(http.StatusOK).JSON(response)
}

// GetByIncidentID retrieves an investigation by incident ID
func (h *InvestigationHandler) GetByIncidentID(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to fetch investigation by incident ID", map[string]interface{}{
		"path":       c.Path(),
		"incidentID": c.Params("incidentId"),
	})

	incidentID, err := uuid.Parse(c.Params("incidentId"))
	if err != nil {
		utils.LogError("Invalid incident ID format", map[string]interface{}{
			"incidentID": c.Params("incidentId"),
			"error":      err.Error(),
		})
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid incident ID"})
	}

	utils.LogDebug("Fetching investigation by incident ID", map[string]interface{}{
		"incidentID": incidentID,
	})

	investigation, err := h.Service.FullGetByIncidentID(c.Context(), incidentID)
	if err != nil {
		utils.LogError("Failed to fetch investigation", map[string]interface{}{
			"incidentID": incidentID,
			"error":      err.Error(),
		})
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully retrieved investigation", map[string]interface{}{
		"investigationID": investigation.ID,
	})
	return c.Status(http.StatusOK).JSON(investigation)
}

// GetByID retrieves an investigation by ID
func (h *InvestigationHandler) GetByID(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to fetch investigation by ID", map[string]interface{}{
		"path": c.Path(),
		"id":   c.Params("id"),
	})

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		utils.LogError("Invalid investigation ID format", map[string]interface{}{
			"investigationID": c.Params("id"),
			"error":           err.Error(),
		})
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid investigation ID"})
	}

	utils.LogDebug("Fetching investigation by ID", map[string]interface{}{
		"investigationID": id,
	})

	investigation, err := h.Service.FullGetByID(c.Context(), id)
	if err != nil {
		utils.LogError("Failed to fetch investigation", map[string]interface{}{
			"investigationID": id,
			"error":           err.Error(),
		})
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully retrieved investigation", map[string]interface{}{
		"investigationID": investigation.ID,
	})
	return c.Status(http.StatusOK).JSON(investigation)
}

// Create creates a new investigation
func (h *InvestigationHandler) Create(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to create an investigation", map[string]interface{}{
		"path": c.Path(),
	})

	var form schema.InvestigationForm
	if err := c.BodyParser(&form); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	utils.LogDebug("Creating investigation", map[string]interface{}{
		"request": form,
	})

	investigation, err := h.Service.Create(&form)
	if err != nil {
		utils.LogError("Failed to create investigation", map[string]interface{}{
			"request": form,
			"error":   err.Error(),
		})
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully created investigation", map[string]interface{}{
		"investigationID": investigation.ID,
	})

	err = h.NotificationSVC.NotifyInvestigationLeader(investigation)
	if err != nil {
		utils.LogError("Failed to send notification", map[string]interface{}{
			"investigationID": investigation.ID,
			"error":           err.Error(),
		})
	}

	return c.Status(http.StatusCreated).JSON(investigation)
}

// Update updates an existing investigation
func (h *InvestigationHandler) Update(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to update an investigation", map[string]interface{}{
		"path": c.Path(),
		"id":   c.Params("id"),
	})

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		utils.LogError("Invalid investigation ID format", map[string]interface{}{
			"investigationID": c.Params("id"),
			"error":           err.Error(),
		})
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid investigation ID"})
	}

	var form schema.FlexibleInvestigationForm
	if err := c.BodyParser(&form); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	utils.LogDebug("Updating investigation", map[string]interface{}{
		"investigationID": id,
		"request":         form,
	})

	investigation, err := h.Service.Update(id, &form)
	if err != nil {
		utils.LogError("Failed to update investigation", map[string]interface{}{
			"investigationID": id,
			"request":         form,
			"error":           err.Error(),
		})
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully updated investigation", map[string]interface{}{
		"investigationID": investigation.ID,
	})

	response := schema.ConvertToInvestigationResponse(investigation)
	return c.Status(http.StatusOK).JSON(response)
}

// Delete deletes an investigation by ID
func (h *InvestigationHandler) Delete(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to delete an investigation", map[string]interface{}{
		"path": c.Path(),
		"id":   c.Params("id"),
	})

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		utils.LogError("Invalid investigation ID format", map[string]interface{}{
			"investigationID": c.Params("id"),
			"error":           err.Error(),
		})
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid investigation ID"})
	}

	utils.LogDebug("Deleting investigation", map[string]interface{}{
		"investigationID": id,
	})

	if err := h.Service.Delete(id); err != nil {
		utils.LogError("Failed to delete investigation", map[string]interface{}{
			"investigationID": id,
			"error":           err.Error(),
		})
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully deleted investigation", map[string]interface{}{
		"investigationID": id,
	})
	return c.Status(http.StatusOK).JSON(fiber.Map{"message": "Investigation deleted successfully"})
}

// CloseInvestigation closes an investigation by ID
func (h *InvestigationHandler) CloseInvestigation(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to close an investigation", map[string]interface{}{
		"path": c.Path(),
		"id":   c.Params("id"),
	})

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		utils.LogError("Invalid investigation ID format", map[string]interface{}{
			"investigationID": c.Params("id"),
			"error":           err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid investigation ID"})
	}

	utils.LogDebug("Closing investigation", map[string]interface{}{
		"investigationID": id,
	})

	if err := h.Service.CloseInvestigation(id); err != nil {
		utils.LogError("Failed to close investigation", map[string]interface{}{
			"investigationID": id,
			"error":           err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully closed investigation", map[string]interface{}{
		"investigationID": id,
	})
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Investigation closed successfully"})
}
