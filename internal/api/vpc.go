package api

import (
	"encoding/json"
	"mime/multipart"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/schema"
	"github.com/hopkali04/health-sys/internal/services"
	"github.com/hopkali04/health-sys/internal/utils"
)

// VPCHandler handles HTTP requests for VPC resources
type VPCHandler struct {
	service *services.VPCService
}

// NewVPCHandler creates a new VPC handler
func NewVPCHandler(service *services.VPCService) *VPCHandler {
	return &VPCHandler{service: service}
}

// CreateVPC creates a new VPC
func (h *VPCHandler) CreateVPC(c *fiber.Ctx) error {
	var req schema.VPCRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("Invalid request body"))
	}

	// Validate the request
	if req.ReportedBy == "" || req.Department == "" || req.Description == "" ||
		req.VpcType == "" || req.ActionTaken == "" || req.IncidentRelatesTo == "" {
		return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("All fields are required"))
	}

	// Validate VpcType
	// if req.VpcType != "safe" && req.VpcType != "unsafe" {
	// 	return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("VpcType must be either 'safe' or 'unsafe'"))
	// }

	// Get the currently authenticated user's ID from context locals
	userIDRaw := c.Locals("userID")
	if userIDRaw == nil {
		utils.LogError("Unauthorized: userID missing from c.Locals", map[string]interface{}{})
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	userIDStr, ok := userIDRaw.(string)
	if !ok {
		utils.LogError("Invalid userID format in c.Locals (expected string)", map[string]interface{}{"userID": userIDRaw})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format"})
	}
	authUserUUID, err := uuid.Parse(userIDStr)
	if err != nil {
		utils.LogError("Failed to parse userID string to UUID", map[string]interface{}{"userIDStr": userIDStr, "error": err.Error()})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format (parsing failed)"})
	}

	employee, err := h.service.GetEmployeeByUserID(authUserUUID) // Ensure h.service is correctly initialized
	if err != nil {
		utils.LogError("Failed to get employee by user ID", map[string]interface{}{
			"authUserUUID": authUserUUID,
			"error":        err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to retrieve employee details", "details": err.Error()})
	}
	if employee == nil {
		utils.LogError("Employee not found for authenticated user", map[string]interface{}{"authUserUUID": authUserUUID})
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "employee profile not found for the authenticated user"})
	}

	req.CreatedBy = employee.ID // Set the creator ID in the request

	vpc := req.ToModel()
	err = h.service.Create(&vpc)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(schema.NewErrorResponse("Failed to create VPC: " + err.Error()))
	}
	// Run email sending in a goroutine to avoid blocking the response
	go h.service.HandleCreateVPCMail(&vpc)

	return c.Status(fiber.StatusCreated).JSON(schema.NewSuccessResponse("VPC created successfully", schema.FromModel(vpc)))
}

// CreateBulkVPCs creates multiple VPCs at once
func (h *VPCHandler) CreateBulkVPCs(c *fiber.Ctx) error {
	var req schema.BulkVPCRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("Invalid request body"))
	}

	if len(req.VPCs) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("No VPCs provided"))
	}

	// Validate each VPC in the bulk request
	for i, vpcReq := range req.VPCs {
		if vpcReq.ReportedBy == "" || vpcReq.Department == "" || vpcReq.Description == "" ||
			vpcReq.VpcType == "" || vpcReq.ActionTaken == "" || vpcReq.IncidentRelatesTo == "" {
			return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("All fields are required for VPC at index " + string(i)))
		}

		// if vpcReq.VpcType != "safe" && vpcReq.VpcType != "unsafe" {
		// 	return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("VpcType must be either 'safe' or 'unsafe' for VPC at index " + string(i)))
		// }
	}

	vpcs := req.ToModel()
	err := h.service.CreateBulk(vpcs)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(schema.NewErrorResponse("Failed to create VPCs: " + err.Error()))
	}

	return c.Status(fiber.StatusCreated).JSON(schema.NewSuccessResponse("VPCs created successfully", nil))
}
func (h *VPCHandler) CreateVPCWithAttachments(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to create a VPC with attachments", map[string]interface{}{
		"path":        c.Path(),
		"contentType": c.Get("Content-Type"), // Good to log what was received
	})

	// REMOVED: Explicit Content-Type check. We'll rely on c.MultipartForm() to fail
	// if the content isn't parseable as multipart.
	/*
		contentType := c.Get("Content-Type")
		if !strings.HasPrefix(contentType, "multipart/form-data") {
			utils.LogError("Invalid Content-Type header", map[string]interface{}{
				"contentType": contentType,
			})
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Content-Type must be multipart/form-data"})
		}
	*/

	// Parse the multipart form. This will handle cases where Content-Type is not multipart.
	form, err := c.MultipartForm()
	if err != nil {
		// Log the content type received when parsing fails
		receivedContentType := c.Get("Content-Type")
		// Special case for EOF error which might happen with empty forms or critical missing parts
		if err.Error() == "multipart: NextPart: EOF" {
			utils.LogError("Empty or incomplete multipart form received (EOF)", map[string]interface{}{
				"contentType": receivedContentType,
			})
			// This error might indicate that 'vpcData' or other essential parts are missing.
			// The check for `vpcDataValues` later will be more specific.
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "multipart form seems empty or incomplete, ensure vpcData is provided"})
		}
		// Handle other multipart errors
		utils.LogError("Failed to parse multipart form", map[string]interface{}{
			"error":       err.Error(),
			"contentType": receivedContentType,
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "failed to parse form data", "details": err.Error()})
	}

	// Get vpcData from the parsed form values
	vpcDataValues := form.Value["vpcData"]
	if len(vpcDataValues) == 0 {
		utils.LogError("VPC data (vpcData form field) is missing", map[string]interface{}{})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "vpcData form field is required"})
	}
	vpcDataStr := vpcDataValues[0]

	var req schema.VPCRequest_new
	if err := json.Unmarshal([]byte(vpcDataStr), &req); err != nil {
		utils.LogError("Invalid VPC data format", map[string]interface{}{
			"vpcData": vpcDataStr,
			"error":   err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid VPC data format", "details": err.Error()})
	}

	// Basic validation of VPCRequest fields
	if req.ReportedBy == "" || req.Department == "" || req.Description == "" ||
		req.VpcType == "" || req.ActionTaken == "" || req.IncidentRelatesTo == "" {
		utils.LogError("Missing required fields in vpcData", map[string]interface{}{"request": req})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "All fields in vpcData are required"})
	}
	// if req.VpcType != "safe" && req.VpcType != "unsafe" {
	// 	utils.LogError("Invalid VpcType in vpcData", map[string]interface{}{"vpcType": req.VpcType})
	// 	return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "VpcType must be either 'safe' or 'unsafe'"})
	// }

	// Get the currently authenticated user's ID from context locals
	userIDRaw := c.Locals("userID")
	if userIDRaw == nil {
		utils.LogError("Unauthorized: userID missing from c.Locals", map[string]interface{}{})
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	userIDStr, ok := userIDRaw.(string)
	if !ok {
		utils.LogError("Invalid userID format in c.Locals (expected string)", map[string]interface{}{"userID": userIDRaw})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format"})
	}
	authUserUUID, err := uuid.Parse(userIDStr)
	if err != nil {
		utils.LogError("Failed to parse userID string to UUID", map[string]interface{}{"userIDStr": userIDStr, "error": err.Error()})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid user ID format (parsing failed)"})
	}

	// Fetch employee details
	employee, err := h.service.GetEmployeeByUserID(authUserUUID) // Ensure h.service is correctly initialized
	if err != nil {
		utils.LogError("Failed to get employee by user ID", map[string]interface{}{
			"authUserUUID": authUserUUID,
			"error":        err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to retrieve employee details", "details": err.Error()})
	}
	if employee == nil {
		utils.LogError("Employee not found for authenticated user", map[string]interface{}{"authUserUUID": authUserUUID})
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "employee profile not found for the authenticated user"})
	}
	creatorEmployeeID := employee.ID

	// Handle file uploads (attachments are optional)
	var uploadedFiles []*multipart.FileHeader
	if form.File != nil { // form.File itself could be nil if no files are sent
		files := form.File["attachments"] // This is []*multipart.FileHeader
		if len(files) > 0 {
			utils.LogInfo("Files detected in 'attachments' field", map[string]interface{}{"count": len(files)})
			for _, file := range files {
				if !utils.IsAllowedFileType(file.Filename) {
					utils.LogError("Invalid file type detected", map[string]interface{}{"file": file.Filename})
					return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
						"error": "invalid file type",
						"file":  file.Filename,
					})
				}
				uploadedFiles = append(uploadedFiles, file)
			}
		}
	}

	// Call the service to create VPC and handle attachments
	vpc, err := h.service.CreateVPCWithAttachments(req, uploadedFiles, creatorEmployeeID)
	if err != nil {
		utils.LogError("Service failed to create VPC with attachments", map[string]interface{}{
			"creatorEmployeeID": creatorEmployeeID,
			"error":             err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create VPC", "details": err.Error()})
	}

	utils.LogInfo("Successfully created VPC with attachments", map[string]interface{}{
		"vpcID":             vpc.ID,
		"creatorEmployeeID": creatorEmployeeID,
		"filesUploaded":     len(vpc.Attachments), // Assuming vpc.Attachments reflects successfully saved files
	})

	// Handle mail notification
	go h.service.HandleCreateVPCMail(vpc)

	return c.Status(fiber.StatusCreated).JSON(schema.FromModel(*vpc))
}

// GetVPC retrieves a VPC by ID
func (h *VPCHandler) GetVPC(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("VPC ID is required"))
	}

	vpc, err := h.service.Get(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(schema.NewErrorResponse("VPC not found: " + err.Error()))
	}

	return c.Status(fiber.StatusOK).JSON(schema.NewSuccessResponse("VPC retrieved successfully", schema.FromModel(*vpc)))
}

// GetVPCByNumber retrieves a VPC by VPC number
func (h *VPCHandler) GetVPCByNumber(c *fiber.Ctx) error {
	vpcNumber := c.Params("vpcNumber")
	if vpcNumber == "" {
		return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("VPC number is required"))
	}

	vpc, err := h.service.GetByVpcNumber(vpcNumber)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(schema.NewErrorResponse("VPC not found: " + err.Error()))
	}

	return c.Status(fiber.StatusOK).JSON(schema.NewSuccessResponse("VPC retrieved successfully", schema.FromModel(*vpc)))
}

// ListAllVPCs retrieves all VPCs with pagination
func (h *VPCHandler) ListAllVPCs(c *fiber.Ctx) error {
	// Get pagination parameters from query
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("pageSize", 10)

	// Validate pagination parameters
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10 // Set a reasonable default and max limit
	}

	vpcs, totalCount, err := h.service.ListAllWithAttachments(page, pageSize)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(schema.NewErrorResponse("Failed to retrieve VPCs: " + err.Error()))
	}

	// Create pagination response
	paginationResponse := schema.NewPaginationResponse(schema.FromModel_newList(vpcs), totalCount, page, pageSize)

	return c.Status(fiber.StatusOK).JSON(schema.NewSuccessResponse("VPCs retrieved successfully", paginationResponse))
}

// UpdateVPC updates an existing VPC
func (h *VPCHandler) UpdateVPC(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("VPC ID is required"))
	}

	var req schema.VPCRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("Invalid request body"))
	}

	// Validate the request
	if req.ReportedBy == "" || req.Department == "" || req.Description == "" ||
		req.VpcType == "" || req.ActionTaken == "" || req.IncidentRelatesTo == "" {
		return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("All fields are required"))
	}

	// Validate VpcType
	// if req.VpcType != "safe" && req.VpcType != "unsafe" {
	// 	return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("VpcType must be either 'safe' or 'unsafe'"))
	// }

	// Get existing VPC
	_, err := h.service.Get(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(schema.NewErrorResponse("VPC not found: " + err.Error()))
	}

	// Update fields
	vpc := req.ToModel()
	vpc.ID = id

	err = h.service.Update(&vpc)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(schema.NewErrorResponse("Failed to update VPC: " + err.Error()))
	}

	return c.Status(fiber.StatusOK).JSON(schema.NewSuccessResponse("VPC updated successfully", schema.FromModel(vpc)))
}

// DeleteVPC deletes a VPC by ID
func (h *VPCHandler) DeleteVPC(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("VPC ID is required"))
	}

	err := h.service.Delete(id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(schema.NewErrorResponse("Failed to delete VPC: " + err.Error()))
	}

	return c.Status(fiber.StatusOK).JSON(schema.NewSuccessResponse("VPC deleted successfully", nil))
}

// ListByDepartment retrieves all VPCs for a specific department with pagination
func (h *VPCHandler) ListByDepartment(c *fiber.Ctx) error {
	department := c.Params("department")
	if department == "" {
		return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("Department is required"))
	}

	// Get pagination parameters from query
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("pageSize", 10)

	// Validate pagination parameters
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10 // Set a reasonable default and max limit
	}

	vpcs, totalCount, err := h.service.ListByDepartment(department, page, pageSize)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(schema.NewErrorResponse("Failed to retrieve VPCs: " + err.Error()))
	}

	// Create pagination response
	paginationResponse := schema.NewPaginationResponse(schema.FromModelList(vpcs), totalCount, page, pageSize)

	return c.Status(fiber.StatusOK).JSON(schema.NewSuccessResponse("VPCs retrieved successfully", paginationResponse))
}

// ListByVpcType retrieves all VPCs of a specific type (safe/unsafe) with pagination
func (h *VPCHandler) ListByVpcType(c *fiber.Ctx) error {
	vpcType := c.Params("vpcType")
	if vpcType == "" {
		return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("VPC type is required"))
	}

	// if vpcType != "safe" && vpcType != "unsafe" {
	// 	return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("VPC type must be either 'safe' or 'unsafe'"))
	// }

	// Get pagination parameters from query
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("pageSize", 10)

	// Validate pagination parameters
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10 // Set a reasonable default and max limit
	}

	vpcs, totalCount, err := h.service.ListByVpcType(vpcType, page, pageSize)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(schema.NewErrorResponse("Failed to retrieve VPCs: " + err.Error()))
	}

	// Create pagination response
	paginationResponse := schema.NewPaginationResponse(schema.FromModelList(vpcs), totalCount, page, pageSize)

	return c.Status(fiber.StatusOK).JSON(schema.NewSuccessResponse("VPCs retrieved successfully", paginationResponse))
}
