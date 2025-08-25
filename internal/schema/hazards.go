package schema

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
)

// CreateHazardRequest defines the structure for creating a new hazard.
type CreateHazardRequest struct {
	Type              string    `json:"type" validate:"required,oneof=unsafe_act unsafe_condition environmental"`
	RiskLevel         string    `json:"riskLevel" validate:"required,oneof=low medium high extreme"`
	Title             string    `json:"title" validate:"required,max=255"`
	Description       string    `json:"description" validate:"required"`
	Location          string    `json:"location" validate:"required,max=255"`
	FullLocation      string    `json:"fullLocation" validate:"required,max=255"`
	RecommendedAction string    `json:"recommendedAction"`
	ReporterFullName  string    `json:"reporterFullName"`
	AssignedTo        uuid.UUID `json:"assignedTo"`
}

// UpdateHazardRequest defines the structure for updating an existing hazard.
type UpdateHazardRequest struct {
	Type              *string `json:"type" validate:"omitempty,oneof=unsafe_act unsafe_condition environmental"`
	RiskLevel         *string `json:"riskLevel" validate:"omitempty,oneof=low medium high extreme"`
	Status            *string `json:"status" validate:"omitempty,oneof=new assessing action_required resolved closed"`
	Title             *string `json:"title" validate:"omitempty,max=255"`
	Description       *string `json:"description"`
	Location          *string `json:"location" validate:"omitempty,max=255"`
	FullLocation      *string `json:"fullLocation" validate:"omitempty,max=255"`
	RecommendedAction *string `json:"recommendedAction"`
	UserHazardID      *string `json:"userHazardID"`
	ReporterFullName  *string `json:"reporterFullName"`
}

// HazardResponse defines the structure of a hazard for API responses.
type HazardResponse struct {
	ID                string     `json:"id"`
	ReferenceNumber   string     `json:"referenceNumber"`
	Type              string     `json:"type"`
	RiskLevel         string     `json:"riskLevel"`
	Status            string     `json:"status"`
	Title             string     `json:"title"`
	Description       string     `json:"description"`
	Location          string     `json:"location"`
	FullLocation      string     `json:"fullLocation"`
	RecommendedAction string     `json:"recommendedAction,omitempty"`
	ReportedBy        string     `json:"reportedBy"`
	UserReported      string     `json:"userReported"`
	AssignedTo        *string    `json:"assignedTo,omitempty"`
	CreatedAt         time.Time  `json:"createdAt"`
	UpdatedAt         time.Time  `json:"updatedAt"`
	ClosedAt          *time.Time `json:"closedAt,omitempty"`
}

// ToHazardResponse maps a models.Hazard object to a HazardResponse DTO.
func ToHazardResponse(h models.Hazard) HazardResponse {
	var assignedTo *string
	if h.AssignedTo != nil {
		id := h.AssignedTo.String()
		assignedTo = &id
	}

	var closedAt *time.Time
	if h.ClosedAt != nil && !h.ClosedAt.IsZero() {
		closedAt = h.ClosedAt
	}

	return HazardResponse{
		ID:                h.ID.String(),
		ReferenceNumber:   h.ReferenceNumber,
		Type:              h.Type,
		RiskLevel:         h.RiskLevel,
		Status:            h.Status,
		Title:             h.Title,
		Description:       h.Description,
		Location:          h.Location,
		FullLocation:      h.FullLocation,
		RecommendedAction: h.RecommendedAction,
		ReportedBy:        fmt.Sprintf("%s %s", h.Reporter.FirstName, h.Reporter.LastName),
		UserReported:      h.UserReported,
		AssignedTo:        assignedTo,
		CreatedAt:         h.CreatedAt,
		UpdatedAt:         h.UpdatedAt,
		ClosedAt:          closedAt,
	}
}

// ToHazardResponses maps a slice of models.Hazard to a slice of HazardResponse DTOs.
func ToHazardResponses(hazards []models.Hazard) []HazardResponse {
	responses := make([]HazardResponse, len(hazards))
	for i, hazard := range hazards {
		responses[i] = ToHazardResponse(hazard)
	}
	return responses
}
