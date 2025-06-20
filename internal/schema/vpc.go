package schema

import (
	"time"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
)

// VPCRequest represents the request body for creating or updating a VPC
type VPCRequest struct {
	// VpcNumber         string    `json:"vpcNumber"`
	ReportedBy        string    `json:"reportedBy" validate:"required"`
	ReportedDate      time.Time `json:"reportedDate" validate:"required"`
	Department        string    `json:"department" validate:"required"`
	Description       string    `json:"description" validate:"required"`
	VpcType           string    `json:"vpcType" validate:"required"`
	ActionTaken       string    `json:"actionTaken" validate:"required"`
	IncidentRelatesTo string    `json:"incidentRelatesTo" validate:"required"`
	CreatedBy         uuid.UUID `json:"createdBy"` // This will be set in the service layer
}

// VPCResponse represents the response format for a VPC
type VPCResponse struct {
	ID                string    `json:"id"`
	VpcNumber         string    `json:"vpcNumber"`
	ReportedBy        string    `json:"reportedBy"`
	ReportedDate      time.Time `json:"reportedDate"`
	Department        string    `json:"department"`
	Description       string    `json:"description"`
	VpcType           string    `json:"vpcType"`
	ActionTaken       string    `json:"actionTaken"`
	IncidentRelatesTo string    `json:"incidentRelatesTo"`
}

// BulkVPCRequest represents a request containing multiple VPCs
type BulkVPCRequest struct {
	VPCs []VPCRequest `json:"vpcs" validate:"required,min=1,dive"`
}

// PaginationResponse represents paginated response data
type PaginationResponse struct {
	Items      interface{} `json:"items"`
	TotalCount int64       `json:"totalCount"`
	Page       int         `json:"page"`
	PageSize   int         `json:"pageSize"`
	TotalPages int         `json:"totalPages"`
}

// NewPaginationResponse creates a new pagination response
func NewPaginationResponse(items interface{}, totalCount int64, page, pageSize int) PaginationResponse {
	totalPages := int(totalCount) / pageSize
	if int(totalCount)%pageSize > 0 {
		totalPages++
	}

	return PaginationResponse{
		Items:      items,
		TotalCount: totalCount,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}
}

// APIResponse is a generic response envelope
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// NewAPIResponse creates a new API response
func NewAPIResponse(success bool, message string, data interface{}) APIResponse {
	return APIResponse{
		Success: success,
		Message: message,
		Data:    data,
	}
}

// NewErrorResponse creates a new error response
func NewErrorResponse(message string) APIResponse {
	return APIResponse{
		Success: false,
		Message: message,
	}
}

// NewSuccessResponse creates a new success response
func NewSuccessResponse(message string, data interface{}) APIResponse {
	return APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	}
}

// ToModel converts a VPCRequest to a VPC model
func (r *VPCRequest) ToModel() models.VPC {
	return models.VPC{
		// VpcNumber:         r.VpcNumber,
		ReportedBy:        r.ReportedBy,
		ReportedDate:      r.ReportedDate,
		Department:        r.Department,
		Description:       r.Description,
		VpcType:           r.VpcType,
		ActionTaken:       r.ActionTaken,
		IncidentRelatesTo: r.IncidentRelatesTo,
		CreatedBy:         r.CreatedBy,
	}
}

// ToModel converts a BulkVPCRequest to a slice of VPC models
func (br *BulkVPCRequest) ToModel() []models.VPC {
	vpcs := make([]models.VPC, len(br.VPCs))
	for i, req := range br.VPCs {
		vpcs[i] = req.ToModel()
	}
	return vpcs
}

// FromModel converts a VPC model to a VPCResponse
func FromModel(vpc models.VPC) VPCResponse {
	return VPCResponse{
		ID:                vpc.ID,
		VpcNumber:         vpc.VpcNumber,
		ReportedBy:        vpc.ReportedBy,
		ReportedDate:      vpc.ReportedDate,
		Department:        vpc.Department,
		Description:       vpc.Description,
		VpcType:           vpc.VpcType,
		ActionTaken:       vpc.ActionTaken,
		IncidentRelatesTo: vpc.IncidentRelatesTo,
	}
}

// FromModelList converts a slice of VPC models to a slice of VPCResponses
func FromModelList(vpcs []models.VPC) []VPCResponse {
	responses := make([]VPCResponse, len(vpcs))
	for i, vpc := range vpcs {
		responses[i] = FromModel(vpc)
	}
	return responses
}
