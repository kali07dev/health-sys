// handlers/incident_handler.go
package api

import (
	"encoding/json"
	"mime/multipart"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/log"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/schema"
	"github.com/hopkali04/health-sys/internal/services"
)

type IncidentsHandler struct {
	service       *services.IncidentService
	attachmentSVC *services.AttachmentService
	employeeSVC		*services.EmployeeService
}

func NewIncidentsHandler(service *services.IncidentService, attSvc *services.AttachmentService, employeeSVC *services.EmployeeService) *IncidentsHandler {
	return &IncidentsHandler{
		service:       service,
		attachmentSVC: attSvc,
		employeeSVC:  employeeSVC,
	}
}

// func (h *IncidentsHandler) RegisterRoutes(r *fiber.App) {
// 	v1 := r.Group("/api/v1")
// 	v1.Post("/incidents", h.CreateIncident)
// 	v1.Post("/incidents/with-attachments", h.CreateIncidentWithAttachments)
// }
func (h *IncidentsHandler) GetIncidentsByEmployeeID(c *fiber.Ctx) error {
	// Parse employee ID from the request
	employeeIDStr := c.Params("id")
	employeeID, err := uuid.Parse(employeeIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid employee ID",
		})
	}
	employee, err := h.service.GetEmployeeByUserID(employeeID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to check user existence", "details": err.Error()})
	}

	// Fetch incidents by employee ID
	incidents, err := h.service.GetByEmployeeID(employee.ID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Return the incidents
	return c.Status(fiber.StatusOK).JSON(schema.ToIncidentResponses(incidents))
}
func (h *IncidentsHandler) GetIncidentSummary(c *fiber.Ctx) error {
    // Parse incident ID from URL
    idStr := c.Params("id")
    id, err := uuid.Parse(idStr)
    if err != nil {
        log.Error("Failed to parse incident ID: %v", err)
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid incident ID format"})
    }

    // Generate summary
    summary, err := h.service.GenerateIncidentSummary(id)
    if err != nil {
        log.Error("Failed to generate incident summary for ID %v: %v", id, err)
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to generate incident summary", 
            "details": err.Error(),
        })
    }

    // Add a nil check
    if summary == nil {
        log.Warn("Generated incident summary is nil for ID %v", id)
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "No summary found for this incident"})
    }

    log.Info("Successfully retrieved incident summary for ID %v", id)
    return c.JSON(summary)
}
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

	employee, err := h.service.GetEmployeeByUserID(uuidUserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to check user existence", "details": err.Error()})
	}
	
	incident, err := h.service.CreateIncident(req, employee.ID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	h.employeeSVC.HandleSevereIncidentNotification(&req)

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
	// Process all files
	var uploadedFiles []*multipart.FileHeader
	for _, file := range files {
		// Validate file type
		if !isAllowedFileType(file.Filename) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid file type",
				"file":  file.Filename,
			})
		}
		uploadedFiles = append(uploadedFiles, file)
	}

	if len(uploadedFiles) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "no valid files uploaded"})
	}

	// Use first file for now (service method needs to be updated to handle multiple files)
	// file := uploadedFiles[0]

	// Type assertion for userID
	userIDStr, ok := userID.(string)
	if !ok {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format", "userID": userID})
	}

	uuidUserID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format", "userID": userID})
	}
	employee, err := h.service.GetEmployeeByUserID(uuidUserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to check user existence", "details": err.Error()})
	}
	

	// req.ReportedBy = uuidUserID

	incident, err := h.service.CreateIncidentWithAttachment(req, uploadedFiles, employee.ID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error(), "req": req, "incidentDataStr": incidentDataStr})
	}

	h.employeeSVC.HandleSevereIncidentNotification(&req)

	return c.Status(fiber.StatusCreated).JSON(incident)
}

// ListIncidentsHandler handles the request to list incidents
func (h *IncidentsHandler) ListIncidentsHandler(c *fiber.Ctx) error {
	// Parse query parameters
	page, err := strconv.Atoi(c.Query("page", "1"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid page number",
		})
	}

	pageSize, err := strconv.Atoi(c.Query("pageSize", "10"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid page size",
		})
	}

	// Parse filters from query parameters
	filters := make(map[string]interface{})
	for key, value := range c.Queries() {
		if key != "page" && key != "pageSize" {
			filters[key] = value
		}
	}

	// Call the service method
	incidents, total, err := h.service.ListIncidents(page, pageSize, filters)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Return the response
	return c.JSON(fiber.Map{
		"data":  schema.ToIncidentResponses(incidents),
		"total": total,
	})
}

// GetIncidentHandler retrieves a single incident by ID
func (h *IncidentsHandler) GetIncidentHandler(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid incident ID",
		})
	}

	incident, err := h.service.GetIncident(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Incident not found",
		})
	}
	attachments, err := h.attachmentSVC.ListAttachments(id)
	if err != nil {
		log.Info("Failed to get attachments for incident %s: %v", id, err)
		attachments = nil
	}

	return c.JSON(fiber.Map{
		"incident":    schema.ToIncidentResponse(*incident),
		"attachments": models.ToAttachmentResponses(attachments),
	})

}

// CloseIncidentHandler closes an incident by ID
func (h *IncidentsHandler) CloseIncidentHandler(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid incident ID",
		})
	}

	incident, err := h.service.CloseIncident(id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(incident)
}

// AssignIncidentToUserHandler assigns an incident to a user
func (h *IncidentsHandler) AssignIncidentToUserHandler(c *fiber.Ctx) error {
	incidentID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid incident ID",
		})
	}

	var request struct {
		UserID uuid.UUID `json:"userId"`
	}
	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	incident, err := h.service.AssignIncidentToUser(incidentID, request.UserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(incident)
}

func (h *IncidentsHandler) ListIncidentsHandlerFiltered(c *fiber.Ctx) error {
	// Parse pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "10"))

	// Parse filters
	filters := make(map[string]interface{})

	// Add type, status, severity_level, assigned_to
	for _, key := range []string{"type", "status", "severity_level"} {
		if value := c.Query(key); value != "" {
			filters[key] = value
		}
	}

	// Parse assigned_to (UUID)
	if assignedTo := c.Query("assigned_to"); assignedTo != "" {
		userID, err := uuid.Parse(assignedTo)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid assigned_to UUID",
			})
		}
		filters["assigned_to"] = userID
	}

	// Parse date range (start_date and end_date)
	if startDate := c.Query("start_date"); startDate != "" {
		parsedStart, err := time.Parse(time.RFC3339, startDate)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid start_date (use RFC3339 format)",
			})
		}
		filters["start_date"] = parsedStart
	}

	if endDate := c.Query("end_date"); endDate != "" {
		parsedEnd, err := time.Parse(time.RFC3339, endDate)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid end_date (use RFC3339 format)",
			})
		}
		filters["end_date"] = parsedEnd
	}

	// Call service method
	incidents, total, err := h.service.ListIncidents(page, pageSize, filters)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Return response
	return c.JSON(fiber.Map{
		"data":  incidents,
		"total": total,
	})
}
func (h *IncidentsHandler) UpdateIncidentStatusHandler(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid incident ID",
		})
	}

	var request struct {
		Status string `json:"status"`
	}
	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	incident, err := h.service.UpdateIncidentStatus(id, request.Status)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(incident)
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
