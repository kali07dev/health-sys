package api

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/schema"
	"github.com/hopkali04/health-sys/internal/services"
	"github.com/hopkali04/health-sys/internal/utils"
)

// HazardHandler handles API requests related to hazards.
type HazardHandler struct {
	Service *services.HazardService
}

// NewHazardHandler creates a new instance of HazardHandler.
func NewHazardHandler(svc *services.HazardService) *HazardHandler {
	return &HazardHandler{Service: svc}
}

// CreateHazard handles the creation of a new hazard.
func (h *HazardHandler) CreateHazard(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to create a hazard", map[string]interface{}{
		"path": c.Path(),
	})

	var req schema.CreateHazardRequest
	if err := c.BodyParser(&req); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{"error": err.Error()})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// For demonstration, we'll extract the user ID from a placeholder.
	// In a real app, this would come from authentication middleware.
	userID, ok := c.Locals("userID").(uuid.UUID)
	if !ok {
		utils.LogError("User ID not found in context", nil)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	hazard, err := h.Service.CreateHazard(req, userID)
	if err != nil {
		utils.LogError("Failed to create hazard", map[string]interface{}{"error": err.Error()})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create hazard"})
	}

	response := schema.ToHazardResponse(*hazard)
	utils.LogInfo("Successfully created hazard", map[string]interface{}{"hazardID": response.ID})
	return c.Status(fiber.StatusCreated).JSON(response)
}

// GetHazard handles retrieving a single hazard by its ID.
func (h *HazardHandler) GetHazard(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to get a hazard", map[string]interface{}{"id": c.Params("id")})

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		utils.LogError("Invalid hazard ID format", map[string]interface{}{"id": c.Params("id"), "error": err.Error()})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid hazard ID format"})
	}

	hazard, err := h.Service.GetHazard(id)
	if err != nil {
		utils.LogError("Failed to get hazard", map[string]interface{}{"id": id, "error": err.Error()})
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Hazard not found"})
	}

	response := schema.ToHazardResponse(*hazard)
	utils.LogInfo("Successfully retrieved hazard", map[string]interface{}{"hazardID": response.ID})
	return c.Status(fiber.StatusOK).JSON(response)
}

// ListHazards handles listing all hazards with pagination.
func (h *HazardHandler) ListHazards(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to list hazards", nil)

	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "10"))

	// Example of how you might handle filters
	filters := make(map[string]interface{})
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}
	if riskLevel := c.Query("risk_level"); riskLevel != "" {
		filters["risk_level"] = riskLevel
	}

	hazards, total, err := h.Service.ListHazards(page, pageSize, filters)
	if err != nil {
		utils.LogError("Failed to list hazards", map[string]interface{}{"error": err.Error()})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve hazards"})
	}

	response := schema.ToHazardResponses(hazards)
	utils.LogInfo("Successfully listed hazards", map[string]interface{}{"count": len(response)})
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"data":  response,
		"total": total,
		"page":  page,
	})
}

// UpdateHazard handles updating an existing hazard.
func (h *HazardHandler) UpdateHazard(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to update a hazard", map[string]interface{}{"id": c.Params("id")})

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		utils.LogError("Invalid hazard ID format", map[string]interface{}{"id": c.Params("id"), "error": err.Error()})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid hazard ID format"})
	}

	var req schema.UpdateHazardRequest
	if err := c.BodyParser(&req); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{"error": err.Error()})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	hazard, err := h.Service.UpdateHazard(id, req)
	if err != nil {
		utils.LogError("Failed to update hazard", map[string]interface{}{"id": id, "error": err.Error()})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update hazard"})
	}

	response := schema.ToHazardResponse(*hazard)
	utils.LogInfo("Successfully updated hazard", map[string]interface{}{"hazardID": response.ID})
	return c.Status(fiber.StatusOK).JSON(response)
}

// DeleteHazard handles deleting a hazard.
func (h *HazardHandler) DeleteHazard(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to delete a hazard", map[string]interface{}{"id": c.Params("id")})

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		utils.LogError("Invalid hazard ID format", map[string]interface{}{"id": c.Params("id"), "error": err.Error()})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid hazard ID format"})
	}

	if err := h.Service.DeleteHazard(id); err != nil {
		utils.LogError("Failed to delete hazard", map[string]interface{}{"id": id, "error": err.Error()})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete hazard"})
	}

	utils.LogInfo("Successfully deleted hazard", map[string]interface{}{"hazardID": id})
	return c.SendStatus(fiber.StatusNoContent)
}

// AssignHazard handles assigning a hazard to a user.
func (h *HazardHandler) AssignHazard(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to assign a hazard", map[string]interface{}{"id": c.Params("id")})

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		utils.LogError("Invalid hazard ID format", map[string]interface{}{"id": c.Params("id"), "error": err.Error()})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid hazard ID format"})
	}

	var req struct {
		UserID uuid.UUID `json:"userId"`
	}

	if err := c.BodyParser(&req); err != nil {
		utils.LogError("Failed to parse request body for assignment", map[string]interface{}{"error": err.Error()})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	hazard, err := h.Service.AssignHazardToUser(id, req.UserID)
	if err != nil {
		utils.LogError("Failed to assign hazard", map[string]interface{}{"hazardID": id, "userID": req.UserID, "error": err.Error()})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to assign hazard"})
	}

	response := schema.ToHazardResponse(*hazard)
	utils.LogInfo("Successfully assigned hazard", map[string]interface{}{"hazardID": response.ID, "assignedTo": req.UserID})
	return c.Status(fiber.StatusOK).JSON(response)
}
