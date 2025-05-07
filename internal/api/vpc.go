package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/hopkali04/health-sys/internal/schema"
	"github.com/hopkali04/health-sys/internal/services"
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
	if req.VpcNumber == "" || req.ReportedBy == "" || req.Department == "" || req.Description == "" ||
		req.VpcType == "" || req.ActionTaken == "" || req.IncidentRelatesTo == "" {
		return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("All fields are required"))
	}

	// Validate VpcType
	if req.VpcType != "safe" && req.VpcType != "unsafe" {
		return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("VpcType must be either 'safe' or 'unsafe'"))
	}

	vpc := req.ToModel()
	err := h.service.Create(&vpc)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(schema.NewErrorResponse("Failed to create VPC: " + err.Error()))
	}
	h.service.HandleCreateVPCMail(&vpc)

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
		if vpcReq.VpcNumber == "" || vpcReq.ReportedBy == "" || vpcReq.Department == "" || vpcReq.Description == "" ||
			vpcReq.VpcType == "" || vpcReq.ActionTaken == "" || vpcReq.IncidentRelatesTo == "" {
			return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("All fields are required for VPC at index " + string(i)))
		}

		if vpcReq.VpcType != "safe" && vpcReq.VpcType != "unsafe" {
			return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("VpcType must be either 'safe' or 'unsafe' for VPC at index " + string(i)))
		}
	}

	vpcs := req.ToModel()
	err := h.service.CreateBulk(vpcs)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(schema.NewErrorResponse("Failed to create VPCs: " + err.Error()))
	}

	return c.Status(fiber.StatusCreated).JSON(schema.NewSuccessResponse("VPCs created successfully", nil))
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

	vpcs, totalCount, err := h.service.ListAll(page, pageSize)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(schema.NewErrorResponse("Failed to retrieve VPCs: " + err.Error()))
	}

	// Create pagination response
	paginationResponse := schema.NewPaginationResponse(schema.FromModelList(vpcs), totalCount, page, pageSize)

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
	if req.VpcNumber == "" || req.ReportedBy == "" || req.Department == "" || req.Description == "" ||
		req.VpcType == "" || req.ActionTaken == "" || req.IncidentRelatesTo == "" {
		return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("All fields are required"))
	}

	// Validate VpcType
	if req.VpcType != "safe" && req.VpcType != "unsafe" {
		return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("VpcType must be either 'safe' or 'unsafe'"))
	}

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

	if vpcType != "safe" && vpcType != "unsafe" {
		return c.Status(fiber.StatusBadRequest).JSON(schema.NewErrorResponse("VPC type must be either 'safe' or 'unsafe'"))
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

	vpcs, totalCount, err := h.service.ListByVpcType(vpcType, page, pageSize)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(schema.NewErrorResponse("Failed to retrieve VPCs: " + err.Error()))
	}

	// Create pagination response
	paginationResponse := schema.NewPaginationResponse(schema.FromModelList(vpcs), totalCount, page, pageSize)

	return c.Status(fiber.StatusOK).JSON(schema.NewSuccessResponse("VPCs retrieved successfully", paginationResponse))
}
