package api

// import (
// 	"github.com/gofiber/fiber/v2"
// 	"github.com/google/uuid"
// 	"github.com/hopkali04/health-sys/internal/models"
// 	"github.com/hopkali04/health-sys/internal/services/incident"
// )

// type IncidentHandler struct {
// 	service incident.Service
// }

// func NewIncidentHandler(service incident.Service) *IncidentHandler {
// 	return &IncidentHandler{service: service}
// }

// func (h *IncidentHandler) CreateIncident(c *fiber.Ctx) error {
// 	var incident models.Incident
// 	if err := c.BodyParser(&incident); err != nil {
// 		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
// 			"error": "Invalid request body",
// 		})
// 	}

// 	if err := h.service.CreateIncident(&incident); err != nil {
// 		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
// 			"error": err.Error(),
// 		})
// 	}

// 	return c.Status(fiber.StatusCreated).JSON(incident)
// }

// func (h *IncidentHandler) GetIncident(c *fiber.Ctx) error {
// 	id := c.Params("id")
// 	incident, err := h.service.GetIncidentByID(uuid.MustParse(id))
// 	if err != nil {
// 		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
// 			"error": "Incident not found",
// 		})
// 	}
// 	return c.JSON(incident)
// }

// func (h *IncidentHandler) UpdateIncident(c *fiber.Ctx) error {
// 	id := c.Params("id")
// 	var incident models.Incident
// 	if err := c.BodyParser(&incident); err != nil {
// 		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
// 			"error": "Invalid request body",
// 		})
// 	}

// 	incident.ID = uuid.MustParse(id)
// 	if err := h.service.UpdateIncident(&incident); err != nil {
// 		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
// 			"error": err.Error(),
// 		})
// 	}

// 	return c.JSON(incident)
// }

// func (h *IncidentHandler) DeleteIncident(c *fiber.Ctx) error {
// 	id := c.Params("id")
// 	if err := h.service.DeleteIncident(uuid.MustParse(id)); err != nil {
// 		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
// 			"error": err.Error(),
// 		})
// 	}
// 	return c.SendStatus(fiber.StatusNoContent)
// }
