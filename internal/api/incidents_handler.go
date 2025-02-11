// handlers/incident_handler.go
package api

import (
	"encoding/json"
	"path/filepath"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/schema"
	"github.com/hopkali04/health-sys/internal/services"
)

type IncidentsHandler struct {
	service *services.IncidentService
}

func NewIncidentsHandler(service *services.IncidentService) *IncidentsHandler {
	return &IncidentsHandler{service: service}
}

// func (h *IncidentsHandler) RegisterRoutes(r *fiber.App) {
// 	v1 := r.Group("/api/v1")
// 	v1.Post("/incidents", h.CreateIncident)
// 	v1.Post("/incidents/with-attachments", h.CreateIncidentWithAttachments)
// }

// CreateIncident handles basic incident creation without attachments
func (h *IncidentsHandler) CreateIncident(c *fiber.Ctx) error {
	// Get the currently authenticated user's ID
	// TODO: MOVE TO UTILS FILE
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	// Type assertion for userID
	userIDStr, ok := userID.(string)
	if !ok {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format", "userID": userID})
	}

	uuidUserID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format", "userID": userID})
	}

	var req schema.CreateIncidentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	incident, err := h.service.CreateIncident(req, uuidUserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(incident)
}

// CreateIncidentWithAttachments handles incident creation with file attachments
func (h *IncidentsHandler) CreateIncidentWithAttachments(c *fiber.Ctx) error {
	// Parse incident data from form
	incidentDataStr := c.FormValue("incidentData")
	if incidentDataStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "incident data is required"})
	}

	var req schema.CreateIncidentRequest
	if err := json.Unmarshal([]byte(incidentDataStr), &req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid incident data format", "incidentData": err.Error()})
	}

	// Get the currently authenticated user's ID
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	// Handle file upload
	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "failed to parse form"})
	}

	files := form.File["attachments"] 
	if len(files) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "no files uploaded", "files": form})
	}

	// Process the first file
	file := files[0]

	// Validate file type
	if !isAllowedFileType(file.Filename) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid file type"})
	}

	// Type assertion for userID
	userIDStr, ok := userID.(string)
	if !ok {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format", "userID": userID})
	}

	uuidUserID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format", "userID": userID})
	}

	// req.ReportedBy = uuidUserID

	incident, err := h.service.CreateIncidentWithAttachment(req, file, uuidUserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error(), "req": req, "incidentDataStr": incidentDataStr})
	}

	return c.Status(fiber.StatusCreated).JSON(incident)
}

// Helper function to validate file types
func isAllowedFileType(filename string) bool {
	ext := filepath.Ext(filename)
	allowedTypes := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".pdf":  true,
		".doc":  true,
		".docx": true,
	}
	return allowedTypes[ext]
}
