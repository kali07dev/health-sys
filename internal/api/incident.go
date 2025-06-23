package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/schema"
	"github.com/hopkali04/health-sys/internal/utils"
)

func (h *IncidentsHandler) UpdateIncidentHandler(c *fiber.Ctx) error {
    utils.LogInfo("Processing request to update incident", map[string]interface{}{
        "path": c.Path(),
    })

    // Parse incident ID
    id, err := uuid.Parse(c.Params("id"))
    if err != nil {
        utils.LogError("Invalid incident ID format", map[string]interface{}{
            "incidentID": c.Params("id"),
            "error":      err.Error(),
        })
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid incident ID"})
    }

    // Parse request body
    var req schema.UpdateIncidentRequest
    if err := c.BodyParser(&req); err != nil {
        utils.LogError("Failed to parse request body", map[string]interface{}{
            "incidentID": id,
            "error":      err.Error(),
        })
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
    }

    // Validate injury type if incident type is being updated to injury
    if req.Type != nil && *req.Type == "injury" && (req.InjuryType == nil || *req.InjuryType == "") {
        utils.LogError("Injury type required", map[string]interface{}{
            "incidentID": id,
            "type":       *req.Type,
        })
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "injury type is required for injury incidents",
        })
    }

    // Update the incident
    incident, err := h.service.UpdateIncident(id, req)
    if err != nil {
        utils.LogError("Failed to update incident", map[string]interface{}{
            "incidentID": id,
            "error":      err.Error(),
        })
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
    }

    utils.LogInfo("Successfully updated incident", map[string]interface{}{
        "incidentID": id,
    })
    return c.JSON(schema.ToIncidentResponse(*incident))
}