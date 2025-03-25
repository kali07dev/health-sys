// handlers/incident_handler.go
package api

import (
	"encoding/json"
	"mime/multipart"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/schema"
	"github.com/hopkali04/health-sys/internal/services"
	"github.com/hopkali04/health-sys/internal/utils"
)

type IncidentsHandler struct {
	service       *services.IncidentService
	attachmentSVC *services.AttachmentService
	employeeSVC   *services.EmployeeService
}

func NewIncidentsHandler(service *services.IncidentService, attSvc *services.AttachmentService, employeeSVC *services.EmployeeService) *IncidentsHandler {
	return &IncidentsHandler{
		service:       service,
		attachmentSVC: attSvc,
		employeeSVC:   employeeSVC,
	}
}

//	func (h *IncidentsHandler) RegisterRoutes(r *fiber.App) {
//		v1 := r.Group("/api/v1")
//		v1.Post("/incidents", h.CreateIncident)
//		v1.Post("/incidents/with-attachments", h.CreateIncidentWithAttachments)
//	}
func (h *IncidentsHandler) GetIncidentsByEmployeeID(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to fetch incidents by employee ID", map[string]interface{}{
		"path": c.Path(),
	})

	// Parse employee ID from the request
	employeeIDStr := c.Params("id")
	employeeID, err := uuid.Parse(employeeIDStr)
	if err != nil {
		utils.LogError("Invalid employee ID format", map[string]interface{}{
			"employeeID": employeeIDStr,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid employee ID"})
	}

	employee, err := h.service.GetEmployeeByUserID(employeeID)
	if err != nil {
		utils.LogError("Failed to check user existence", map[string]interface{}{
			"employeeID": employeeID,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to check user existence", "details": err.Error()})
	}

	// Fetch incidents by employee ID
	incidents, err := h.service.GetByEmployeeID(employee.ID)
	if err != nil {
		utils.LogError("Failed to fetch incidents by employee ID", map[string]interface{}{
			"employeeID": employee.ID,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully fetched incidents by employee ID", map[string]interface{}{
		"employeeID": employee.ID,
		"count":      len(incidents),
	})
	return c.Status(fiber.StatusOK).JSON(schema.ToIncidentResponses(incidents))
}

func (h *IncidentsHandler) GetIncidentSummary(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to fetch incident summary", map[string]interface{}{
		"path": c.Path(),
	})

	// Parse incident ID from URL
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.LogError("Failed to parse incident ID", map[string]interface{}{
			"incidentID": idStr,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid incident ID format"})
	}

	// Generate summary
	summary, err := h.service.GenerateIncidentSummary(id)
	if err != nil {
		utils.LogError("Failed to generate incident summary", map[string]interface{}{
			"incidentID": id,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to generate incident summary",
			"details": err.Error(),
		})
	}

	// Add a nil check
	if summary == nil {
		utils.LogWarn("Generated incident summary is nil", map[string]interface{}{
			"incidentID": id,
		})
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "No summary found for this incident"})
	}

	utils.LogInfo("Successfully retrieved incident summary", map[string]interface{}{
		"incidentID": id,
	})
	return c.JSON(summary)
}

// CreateIncident handles basic incident creation without attachments
func (h *IncidentsHandler) CreateIncident(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to create an incident", map[string]interface{}{
		"path": c.Path(),
	})

	// Get the currently authenticated user's ID
	userID := c.Locals("userID")
	if userID == nil {
		utils.LogError("Unauthorized access", map[string]interface{}{})
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	// Type assertion for userID
	userIDStr, ok := userID.(string)
	if !ok {
		utils.LogError("Invalid user ID format", map[string]interface{}{
			"userID": userID,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format", "userID": userID})
	}

	uuidUserID, err := uuid.Parse(userIDStr)
	if err != nil {
		utils.LogError("Invalid user ID format", map[string]interface{}{
			"userID": userIDStr,
			"error":  err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format", "userID": userID})
	}

	var req schema.CreateIncidentRequest
	if err := c.BodyParser(&req); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	employee, err := h.service.GetEmployeeByUserID(uuidUserID)
	if err != nil {
		utils.LogError("Failed to check user existence", map[string]interface{}{
			"userID": uuidUserID,
			"error":  err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to check user existence", "details": err.Error()})
	}

	incident, err := h.service.CreateIncident(req, employee.ID)
	if err != nil {
		utils.LogError("Failed to create incident", map[string]interface{}{
			"userID": uuidUserID,
			"error":  err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully created incident", map[string]interface{}{
		"incidentID": incident.ID,
		"userID":     uuidUserID,
	})
	h.employeeSVC.HandleSevereIncidentNotification(&req)

	return c.Status(fiber.StatusCreated).JSON(incident)
}

// CreateIncidentWithAttachments handles incident creation with file attachments
func (h *IncidentsHandler) CreateIncidentWithAttachments(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to create an incident with attachments", map[string]interface{}{
		"path": c.Path(),
	})

	// Parse incident data from form
	incidentDataStr := c.FormValue("incidentData")
	if incidentDataStr == "" {
		utils.LogError("Incident data is missing", map[string]interface{}{})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "incident data is required"})
	}

	var req schema.CreateIncidentRequest
	if err := json.Unmarshal([]byte(incidentDataStr), &req); err != nil {
		utils.LogError("Invalid incident data format", map[string]interface{}{
			"incidentData": incidentDataStr,
			"error":        err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid incident data format", "incidentData": err.Error()})
	}

	// Get the currently authenticated user's ID
	userID := c.Locals("userID")
	if userID == nil {
		utils.LogError("Unauthorized access", map[string]interface{}{})
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	// Handle file upload
	form, err := c.MultipartForm()
	if err != nil {
		utils.LogError("Failed to parse form", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "failed to parse form"})
	}

	files := form.File["attachments"]
	if len(files) == 0 {
		utils.LogError("No files uploaded", map[string]interface{}{})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "no files uploaded"})
	}

	// Process all files
	var uploadedFiles []*multipart.FileHeader
	for _, file := range files {
		// Validate file type
		if !isAllowedFileType(file.Filename) {
			utils.LogError("Invalid file type", map[string]interface{}{
				"file": file.Filename,
			})
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid file type",
				"file":  file.Filename,
			})
		}
		uploadedFiles = append(uploadedFiles, file)
	}

	if len(uploadedFiles) == 0 {
		utils.LogError("No valid files uploaded", map[string]interface{}{})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "no valid files uploaded"})
	}

	// Type assertion for userID
	userIDStr, ok := userID.(string)
	if !ok {
		utils.LogError("Invalid user ID format", map[string]interface{}{
			"userID": userID,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format", "userID": userID})
	}

	uuidUserID, err := uuid.Parse(userIDStr)
	if err != nil {
		utils.LogError("Invalid user ID format", map[string]interface{}{
			"userID": userIDStr,
			"error":  err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format", "userID": userID})
	}

	employee, err := h.service.GetEmployeeByUserID(uuidUserID)
	if err != nil {
		utils.LogError("Failed to check user existence", map[string]interface{}{
			"userID": uuidUserID,
			"error":  err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to check user existence", "details": err.Error()})
	}

	incident, err := h.service.CreateIncidentWithAttachment(req, uploadedFiles, employee.ID)
	if err != nil {
		utils.LogError("Failed to create incident with attachments", map[string]interface{}{
			"userID": uuidUserID,
			"error":  err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error(), "req": req, "incidentDataStr": incidentDataStr})
	}

	utils.LogInfo("Successfully created incident with attachments", map[string]interface{}{
		"incidentID": incident.ID,
		"userID":     uuidUserID,
	})
	h.employeeSVC.HandleSevereIncidentNotification(&req)

	return c.Status(fiber.StatusCreated).JSON(incident)
}

// ListIncidentsHandler handles the request to list incidents
func (h *IncidentsHandler) ListIncidentsHandler(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to list incidents", map[string]interface{}{
		"path": c.Path(),
	})

	// Parse query parameters
	page, err := strconv.Atoi(c.Query("page", "1"))
	if err != nil {
		utils.LogError("Invalid page number", map[string]interface{}{
			"page":  c.Query("page"),
			"error": err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid page number"})
	}

	pageSize, err := strconv.Atoi(c.Query("pageSize", "10"))
	if err != nil {
		utils.LogError("Invalid page size", map[string]interface{}{
			"pageSize": c.Query("pageSize"),
			"error":    err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid page size"})
	}
	if pageSize > 100 {
		pageSize = 100 // Max 100 items per page
	}
	if pageSize < 10 {
		pageSize = 10 // Minimum 10 items per page
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
		utils.LogError("Failed to list incidents", map[string]interface{}{
			"page":     page,
			"pageSize": pageSize,
			"filters":  filters,
			"error":    err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully listed incidents", map[string]interface{}{
		"page":     page,
		"pageSize": pageSize,
		"total":    total,
	})
	return c.JSON(fiber.Map{
		"data":       schema.ToIncidentResponses(incidents),
		"total":      total,
		"page":       page,
		"pageSize":   pageSize,
		"totalPages": (total + int64(pageSize) - 1) / int64(pageSize), // Ceiling division
	})

}

// GetIncidentHandler retrieves a single incident by ID
func (h *IncidentsHandler) GetIncidentHandler(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to fetch incident by ID", map[string]interface{}{
		"path": c.Path(),
	})

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		utils.LogError("Invalid incident ID format", map[string]interface{}{
			"incidentID": c.Params("id"),
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid incident ID"})
	}

	incident, err := h.service.GetIncident(id)
	if err != nil {
		utils.LogError("Failed to fetch incident", map[string]interface{}{
			"incidentID": id,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Incident not found"})
	}

	attachments, err := h.attachmentSVC.ListAttachments(id)
	if err != nil {
		utils.LogWarn("Failed to fetch attachments for incident", map[string]interface{}{
			"incidentID": id,
			"error":      err.Error(),
		})
		attachments = nil
	}

	utils.LogInfo("Successfully fetched incident", map[string]interface{}{
		"incidentID": id,
	})
	return c.JSON(fiber.Map{
		"incident":    schema.ToIncidentResponse(*incident),
		"attachments": models.ToAttachmentResponses(attachments),
	})

}

// CloseIncidentHandler closes an incident by ID
func (h *IncidentsHandler) CloseIncidentHandler(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to close incident", map[string]interface{}{
		"path": c.Path(),
	})

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		utils.LogError("Invalid incident ID format", map[string]interface{}{
			"incidentID": c.Params("id"),
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid incident ID"})
	}

	incident, err := h.service.CloseIncident(id)
	if err != nil {
		utils.LogError("Failed to close incident", map[string]interface{}{
			"incidentID": id,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully closed incident", map[string]interface{}{
		"incidentID": id,
	})
	return c.JSON(incident)
}

// AssignIncidentToUserHandler assigns an incident to a user
func (h *IncidentsHandler) AssignIncidentToUserHandler(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to assign incident to user", map[string]interface{}{
		"path": c.Path(),
	})

	incidentID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		utils.LogError("Invalid incident ID format", map[string]interface{}{
			"incidentID": c.Params("id"),
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid incident ID"})
	}

	var request struct {
		UserID uuid.UUID `json:"userId"`
	}
	if err := c.BodyParser(&request); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"incidentID": incidentID,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	incident, err := h.service.AssignIncidentToUser(incidentID, request.UserID)
	if err != nil {
		utils.LogError("Failed to assign incident to user", map[string]interface{}{
			"incidentID": incidentID,
			"userID":     request.UserID,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully assigned incident to user", map[string]interface{}{
		"incidentID": incidentID,
		"userID":     request.UserID,
	})
	return c.JSON(incident)
}

func (h *IncidentsHandler) ListIncidentsHandlerFiltered(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to list filtered incidents", map[string]interface{}{
		"path": c.Path(),
	})

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
			utils.LogError("Invalid assigned_to UUID", map[string]interface{}{
				"assignedTo": assignedTo,
				"error":      err.Error(),
			})
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid assigned_to UUID"})
		}
		filters["assigned_to"] = userID
	}

	// Parse date range (start_date and end_date)
	if startDate := c.Query("start_date"); startDate != "" {
		parsedStart, err := time.Parse(time.RFC3339, startDate)
		if err != nil {
			utils.LogError("Invalid start_date format", map[string]interface{}{
				"startDate": startDate,
				"error":     err.Error(),
			})
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid start_date (use RFC3339 format)"})
		}
		filters["start_date"] = parsedStart
	}

	if endDate := c.Query("end_date"); endDate != "" {
		parsedEnd, err := time.Parse(time.RFC3339, endDate)
		if err != nil {
			utils.LogError("Invalid end_date format", map[string]interface{}{
				"endDate": endDate,
				"error":   err.Error(),
			})
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid end_date (use RFC3339 format)"})
		}
		filters["end_date"] = parsedEnd
	}

	// Call service method
	incidents, total, err := h.service.ListIncidents(page, pageSize, filters)
	if err != nil {
		utils.LogError("Failed to list filtered incidents", map[string]interface{}{
			"filters": filters,
			"error":   err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully listed filtered incidents", map[string]interface{}{
		"filters": filters,
		"total":   total,
	})
	return c.JSON(fiber.Map{
		"data":  incidents,
		"total": total,
	})
}

func (h *IncidentsHandler) UpdateIncidentStatusHandler(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to update incident status", map[string]interface{}{
		"path": c.Path(),
	})

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		utils.LogError("Invalid incident ID format", map[string]interface{}{
			"incidentID": c.Params("id"),
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid incident ID"})
	}

	var request struct {
		Status string `json:"status"`
	}
	if err := c.BodyParser(&request); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"incidentID": id,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	incident, err := h.service.UpdateIncidentStatus(id, request.Status)
	if err != nil {
		utils.LogError("Failed to update incident status", map[string]interface{}{
			"incidentID": id,
			"status":     request.Status,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	utils.LogInfo("Successfully updated incident status", map[string]interface{}{
		"incidentID": id,
		"status":     request.Status,
	})
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
