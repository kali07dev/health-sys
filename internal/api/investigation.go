package api

import (
    "net/http"
    "strconv"

    "github.com/gofiber/fiber/v2"
    "github.com/google/uuid"
    "github.com/hopkali04/health-sys/internal/schema"
	"github.com/hopkali04/health-sys/internal/services"
)

type InvestigationHandler struct {
    Service *services.InvestigationService
}
func NewInvestigationHandler(svc *services.InvestigationService) *InvestigationHandler {
	return &InvestigationHandler{Service: svc}
}
// GetAll Investigations
func (h *InvestigationHandler) GetAll(c *fiber.Ctx) error {
    status := c.Query("status", "")
    limit, _ := strconv.Atoi(c.Query("limit", "0"))
    offset, _ := strconv.Atoi(c.Query("offset", "0"))

    investigations, err := h.Service.GetAll(status, limit, offset)
    if err != nil {
        return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
    }

    response := schema.ConvertToInvestigationResponses(investigations)
    return c.Status(http.StatusOK).JSON(response)
}

// GetByIncidentID
func (h *InvestigationHandler) GetByIncidentID(c *fiber.Ctx) error {
    incidentID, err := uuid.Parse(c.Params("incidentId"))
    if err != nil {
        return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid incident ID"})
    }

    investigation, err := h.Service.GetByIncidentID(incidentID)
    if err != nil {
        return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
    }

    response := schema.ConvertToInvestigationResponse(investigation)
    return c.Status(http.StatusOK).JSON(response)
}

// GetByID
func (h *InvestigationHandler) GetByID(c *fiber.Ctx) error {
    id, err := uuid.Parse(c.Params("id"))
    if err != nil {
        return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid investigation ID"})
    }

    investigation, err := h.Service.GetByID(id)
    if err != nil {
        return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
    }

    response := schema.ConvertToInvestigationResponse(investigation)
    return c.Status(http.StatusOK).JSON(response)
}

// Create
func (h *InvestigationHandler) Create(c *fiber.Ctx) error {
    var form schema.InvestigationForm
    if err := c.BodyParser(&form); err != nil {
        return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
    }

    investigation, err := h.Service.Create(&form)
    if err != nil {
        return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
    }

    response := schema.ConvertToInvestigationResponse(investigation)
    return c.Status(http.StatusCreated).JSON(response)
}

// Update
func (h *InvestigationHandler) Update(c *fiber.Ctx) error {
    id, err := uuid.Parse(c.Params("id"))
    if err != nil {
        return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid investigation ID"})
    }

    var form schema.InvestigationForm
    if err := c.BodyParser(&form); err != nil {
        return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
    }

    investigation, err := h.Service.Update(id, &form)
    if err != nil {
        return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
    }

    response := schema.ConvertToInvestigationResponse(investigation)
    return c.Status(http.StatusOK).JSON(response)
}

// Delete
func (h *InvestigationHandler) Delete(c *fiber.Ctx) error {
    id, err := uuid.Parse(c.Params("id"))
    if err != nil {
        return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid investigation ID"})
    }

    if err := h.Service.Delete(id); err != nil {
        return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
    }

    return c.Status(http.StatusOK).JSON(fiber.Map{"message": "Investigation deleted successfully"})
}