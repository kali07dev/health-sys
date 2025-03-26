package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/schema"
	"github.com/hopkali04/health-sys/internal/services"
	"github.com/hopkali04/health-sys/internal/utils"
)

type CorrectiveActionHandler struct {
	CorrectiveActionservice *services.CorrectiveActionService
	NotificationSVC         *services.NotificationService
}

func NewCorrectiveActionHandler(service *services.CorrectiveActionService, notifySVC *services.NotificationService) *CorrectiveActionHandler {
	return &CorrectiveActionHandler{
		CorrectiveActionservice: service,
		NotificationSVC:         notifySVC,
	}
}

// GetCorrectiveActionsByEmployeeID handles fetching corrective actions by employee ID
func (h *CorrectiveActionHandler) GetCorrectiveActionsByEmployeeID(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to fetch corrective actions by employee ID", map[string]interface{}{
		"path":       c.Path(),
		"employeeID": c.Params("id"),
	})

	employeeIDStr := c.Params("id")
	employeeID, err := uuid.Parse(employeeIDStr)
	if err != nil {
		utils.LogError("Invalid employee ID format", map[string]interface{}{
			"employeeID": employeeIDStr,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid employee ID"})
	}

	utils.LogDebug("Fetching employee details", map[string]interface{}{
		"employeeID": employeeID,
	})

	emp, err := h.CorrectiveActionservice.GetEmployeeByUserID(employeeID)
	if err != nil {
		utils.LogError("Failed to fetch employee details", map[string]interface{}{
			"employeeID": employeeID,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to check user existence", "details": err.Error()})
	}

	utils.LogDebug("Fetching corrective actions by employee ID", map[string]interface{}{
		"employeeID": emp.ID,
	})

	actions, err := h.CorrectiveActionservice.GetByEmployeeID(c.Context(), emp.ID)
	if err != nil {
		utils.LogError("Failed to fetch corrective actions", map[string]interface{}{
			"employeeID": emp.ID,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully retrieved corrective actions", map[string]interface{}{
		"employeeID": emp.ID,
		"count":      len(actions),
	})
	return c.Status(fiber.StatusOK).JSON(actions)
}

// GetCorrectiveActionsByIncidentID retrieves corrective actions by incident ID
func (h *CorrectiveActionHandler) GetCorrectiveActionsByIncidentID(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to fetch corrective actions by incident ID", map[string]interface{}{
		"path":       c.Path(),
		"incidentID": c.Params("incidentID"),
	})

	incidentID, err := uuid.Parse(c.Params("incidentID"))
	if err != nil {
		utils.LogError("Invalid incident ID format", map[string]interface{}{
			"incidentID": c.Params("incidentID"),
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid incident ID"})
	}

	utils.LogDebug("Fetching corrective actions by incident ID", map[string]interface{}{
		"incidentID": incidentID,
	})

	actions, err := h.CorrectiveActionservice.GetByIncidentID(c.Context(), incidentID)
	if err != nil {
		utils.LogError("Failed to fetch corrective actions", map[string]interface{}{
			"incidentID": incidentID,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully retrieved corrective actions", map[string]interface{}{
		"incidentID": incidentID,
		"count":      len(actions),
	})
	return c.Status(fiber.StatusOK).JSON(actions)
}

// CreateCorrectiveAction creates a new corrective action
func (h *CorrectiveActionHandler) CreateCorrectiveAction(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to create a corrective action", map[string]interface{}{
		"path": c.Path(),
	})

	var req schema.CreateCorrectiveActionRequest
	if err := c.BodyParser(&req); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	assignedBy, err := uuid.Parse(req.AssignedBy)
	if err != nil {
		utils.LogError("Invalid assignedBy ID format", map[string]interface{}{
			"assignedBy": req.AssignedBy,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Invalid user ID format", "userID": req.AssignedBy})
	}

	utils.LogDebug("Fetching employee details for assignedBy", map[string]interface{}{
		"assignedBy": assignedBy,
	})

	emp, err := h.CorrectiveActionservice.GetEmployeeByUserID(assignedBy)
	if err != nil {
		utils.LogError("Failed to fetch employee details", map[string]interface{}{
			"assignedBy": assignedBy,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to check user existence", "details": err.Error()})
	}

	utils.LogDebug("Creating corrective action", map[string]interface{}{
		"assignedBy": emp.ID,
		"request":    req,
	})

	action, err := h.CorrectiveActionservice.Create(c.Context(), req, emp.ID)
	if err != nil {
		utils.LogError("Failed to create corrective action", map[string]interface{}{
			"assignedBy": emp.ID,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	err = h.NotificationSVC.NotifyActionAssignment(action, emp)
	if err != nil {
		utils.LogError("Failed to send notification", map[string]interface{}{
			"actionID": action.ID,
			"error":    err.Error(),
		})
	}

	utils.LogInfo("Successfully created corrective action", map[string]interface{}{
		"actionID": action.ID,
	})
	return c.Status(fiber.StatusCreated).JSON(schema.ToCActionResponse(action))
}

// GetCorrectiveActionByID retrieves a corrective action by ID
func (h *CorrectiveActionHandler) GetCorrectiveActionByID(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to fetch corrective action by ID", map[string]interface{}{
		"path": c.Path(),
		"id":   c.Params("id"),
	})

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		utils.LogError("Invalid corrective action ID format", map[string]interface{}{
			"actionID": c.Params("id"),
			"error":    err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID"})
	}

	utils.LogDebug("Fetching corrective action by ID", map[string]interface{}{
		"actionID": id,
	})

	action, err := h.CorrectiveActionservice.GetByID(c.Context(), id)
	if err != nil {
		utils.LogError("Failed to fetch corrective action", map[string]interface{}{
			"actionID": id,
			"error":    err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully retrieved corrective action", map[string]interface{}{
		"actionID": id,
	})
	return c.Status(fiber.StatusOK).JSON(action)
}
func (h *CorrectiveActionHandler) AdminCompleteActionAndVerify(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to complete and verify corrective action", map[string]interface{}{
		"path": c.Path(),
		"id":   c.Params("id"),
	})

	actionIDStr := c.Params("id")
	if actionIDStr == "" {
		utils.LogError("Missing action ID in request", map[string]interface{}{
			"error": "Action ID is required",
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Action ID is required"})
	}

	actionID, err := uuid.Parse(actionIDStr)
	if err != nil {
		utils.LogError("Invalid corrective action ID format", map[string]interface{}{
			"actionID": actionIDStr,
			"error":    err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid action ID format"})
	}

	var req schema.UpdateCorrectiveActionRequest
	if err := c.BodyParser(&req); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Failed to parse request body",
			"details": err.Error(),
		})
	}

	utils.LogDebug("Completing and verifying corrective action", map[string]interface{}{
		"actionID": actionID,
		"request":  req,
	})

	employeeIDStr := req.VerifiedBy

	employeeID, err := uuid.Parse(employeeIDStr)
	if err != nil {
		utils.LogError("Invalid employee ID format", map[string]interface{}{
			"employeeID": employeeIDStr,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid employee ID"})
	}

	emp, err := h.CorrectiveActionservice.GetEmployeeByUserID(employeeID)
	if err != nil {
		utils.LogError("Failed to fetch employee details", map[string]interface{}{
			"employeeID": employeeID,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to check user existence", "details": err.Error()})
	}

	if err := h.CorrectiveActionservice.AdminCompleteActionAndVerify(c.Context(), actionID, emp.ID); err != nil {
		utils.LogError("Failed to complete and verify corrective action", map[string]interface{}{
			"actionID": actionID,
			"error":    err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully completed and verified corrective action", map[string]interface{}{
		"actionID": actionID,
	})
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Action completed and verified successfully"})
}

// UpdateCorrectiveAction updates an existing corrective action
func (h *CorrectiveActionHandler) UpdateCorrectiveAction(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to update corrective action", map[string]interface{}{
		"path": c.Path(),
		"id":   c.Params("id"),
	})

	actionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		utils.LogError("Invalid corrective action ID format", map[string]interface{}{
			"actionID": c.Params("id"),
			"error":    err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid action ID format",
		})
	}

	var req schema.UpdateCorrectiveActionRequest
	if err := c.BodyParser(&req); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Failed to parse request body",
			"details": err.Error(),
		})
	}

	userID := c.Locals("userID")
	if userID == nil {
		utils.LogError("Unauthorized access attempt", map[string]interface{}{
			"actionID": actionID,
		})
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	userIDStr, ok := userID.(string)
	if !ok {
		utils.LogError("Invalid user ID format in context", map[string]interface{}{
			"actionID": actionID,
			"userID":   userID,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Invalid user ID format",
		})
	}

	if req.Status == "completed" && req.CompletedAt != "" {
		req.CompletedBy = userIDStr
	}
	if req.VerifiedBy != "" {

		employeeIDStr := req.VerifiedBy

		employeeID, err := uuid.Parse(employeeIDStr)
		if err != nil {
			utils.LogError("Invalid employee ID format", map[string]interface{}{
				"employeeID": employeeIDStr,
				"error":      err.Error(),
			})
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid employee ID"})
		}

		emp, err := h.CorrectiveActionservice.GetEmployeeByUserID(employeeID)
		if err != nil {
			utils.LogError("Failed to fetch employee details", map[string]interface{}{
				"employeeID": employeeID,
				"error":      err.Error(),
			})
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to check user existence", "details": err.Error()})
		}
		req.VerifiedBy = emp.ID.String()
	}

	utils.LogDebug("Updating corrective action", map[string]interface{}{
		"actionID": actionID,
		"request":  req,
	})

	updatedAction, err := h.CorrectiveActionservice.Update(c.Context(), actionID, req)
	if err != nil {
		utils.LogError("Failed to update corrective action", map[string]interface{}{
			"actionID": actionID,
			"error":    err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to update corrective action",
			"details": err.Error(),
		})
	}

	utils.LogInfo("Successfully updated corrective action", map[string]interface{}{
		"actionID": actionID,
	})
	return c.Status(fiber.StatusOK).JSON(schema.ToCActionResponse(updatedAction))
}

// DeleteCorrectiveAction deletes a corrective action by ID
func (h *CorrectiveActionHandler) DeleteCorrectiveAction(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to delete corrective action", map[string]interface{}{
		"path": c.Path(),
		"id":   c.Params("id"),
	})

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		utils.LogError("Invalid corrective action ID format", map[string]interface{}{
			"actionID": c.Params("id"),
			"error":    err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID"})
	}

	utils.LogDebug("Deleting corrective action", map[string]interface{}{
		"actionID": id,
	})

	if err := h.CorrectiveActionservice.Delete(c.Context(), id); err != nil {
		utils.LogError("Failed to delete corrective action", map[string]interface{}{
			"actionID": id,
			"error":    err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully deleted corrective action", map[string]interface{}{
		"actionID": id,
	})
	return c.SendStatus(fiber.StatusNoContent)
}

// LabelAsCompleted marks a corrective action as completed
func (h *CorrectiveActionHandler) LabelAsCompleted(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to label corrective action as completed", map[string]interface{}{
		"path": c.Path(),
		"id":   c.Params("id"),
	})

	actionIDStr := c.Params("id")
	if actionIDStr == "" {
		utils.LogError("Missing action ID in request", map[string]interface{}{
			"error": "Action ID is required",
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Action ID is required"})
	}

	actionID, err := uuid.Parse(actionIDStr)
	if err != nil {
		utils.LogError("Invalid corrective action ID format", map[string]interface{}{
			"actionID": actionIDStr,
			"error":    err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid action ID format"})
	}

	var req schema.CompletionNoted
	if err := c.BodyParser(&req); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Failed to parse request body",
			"details": err.Error(),
		})
	}

	utils.LogDebug("Labeling corrective action as completed", map[string]interface{}{
		"actionID": actionID,
		"notes":    req.Notes,
	})

	if err := h.CorrectiveActionservice.LabelAsCompleted(actionID, req.Notes); err != nil {
		utils.LogError("Failed to label corrective action as completed", map[string]interface{}{
			"actionID": actionID,
			"error":    err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully labeled corrective action as completed", map[string]interface{}{
		"actionID": actionID,
	})
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Action labeled as completed successfully"})
}
