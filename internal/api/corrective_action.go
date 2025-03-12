package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/schema"
	"github.com/hopkali04/health-sys/internal/services"
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
	// Parse employee ID from the request
	employeeIDStr := c.Params("id")
	employeeID, err := uuid.Parse(employeeIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid employee ID",
		})
	}
	emp, err := h.CorrectiveActionservice.GetEmployeeByUserID(employeeID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to check user existence", "details": err.Error()})
	}

	// Fetch corrective actions by employee ID
	actions, err := h.CorrectiveActionservice.GetByEmployeeID(c.Context(), emp.ID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Return the corrective actions
	return c.Status(fiber.StatusOK).JSON(actions)
}

// GetCorrectiveActionsByIncidentID retrieves corrective actions by incident ID
func (h *CorrectiveActionHandler) GetCorrectiveActionsByIncidentID(c *fiber.Ctx) error {
	incidentID, err := uuid.Parse(c.Params("incidentID"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid incident ID"})
	}

	actions, err := h.CorrectiveActionservice.GetByIncidentID(c.Context(), incidentID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(actions)
}

// CreateCorrectiveAction creates a new corrective action
func (h *CorrectiveActionHandler) CreateCorrectiveAction(c *fiber.Ctx) error {
	var req schema.CorrectiveActionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	assignedBy, err := uuid.Parse(req.AssignedBy)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format", "userID": req.AssignedBy})
	}

	emp, err := h.CorrectiveActionservice.GetEmployeeByUserID(assignedBy)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to check user existence", "details": err.Error()})
	}

	action, err := h.CorrectiveActionservice.Create(c.Context(), req, emp.ID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	err = h.NotificationSVC.NotifyActionAssignment(action, emp)
	if err != nil {
		// log Response
	}

	return c.Status(fiber.StatusCreated).JSON(schema.ToCActionResponse(action))
}

// GetCorrectiveActionByID retrieves a corrective action by ID
func (h *CorrectiveActionHandler) GetCorrectiveActionByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid ID"})
	}

	action, err := h.CorrectiveActionservice.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(action)
}

// UpdateCorrectiveAction updates an existing corrective action
func (h *CorrectiveActionHandler) UpdateCorrectiveAction(c *fiber.Ctx) error {
	actionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid action ID format",
		})
	}

	// Get request body
	var req schema.UpdateCorrectiveActionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Failed to parse request body",
			"details": err.Error(),
		})
	}

	// Get user ID from context
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// Convert userID to string and then UUID
	userIDStr, ok := userID.(string)
	if !ok {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Invalid user ID format",
		})
	}

	// If completing the action, set the user as the one who completed it
	if req.Status == "completed" && req.CompletedAt != "" {
		req.CompletedBy = userIDStr
	}

	// Update the action
	updatedAction, err := h.CorrectiveActionservice.Update(c.Context(), actionID, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to update corrective action",
			"details": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(schema.ToCActionResponse(updatedAction))
}

// DeleteCorrectiveAction deletes a corrective action by ID
func (h *CorrectiveActionHandler) DeleteCorrectiveAction(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid ID"})
	}

	if err := h.CorrectiveActionservice.Delete(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusNoContent)
}
func (h *CorrectiveActionHandler) LabelAsCompleted(c *fiber.Ctx) error {
	// Parse action ID from request params
	actionIDStr := c.Params("id")
	if actionIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "action ID is required"})
	}

	// Convert action ID to UUID
	actionID, err := uuid.Parse(actionIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid action ID format"})
	}

	var req schema.CompletionNoted
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Failed to parse request body",
			"details": err.Error(),
		})
	}

	if err := h.CorrectiveActionservice.LabelAsCompleted(actionID, req.Notes); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "action labeled as completed successfully"})
}
