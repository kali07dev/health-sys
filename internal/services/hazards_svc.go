package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/schema"
	"gorm.io/gorm"
)

// HazardService provides methods for interacting with hazard data.
type HazardService struct {
	db *gorm.DB
}

// NewHazardService creates a new instance of HazardService.
func NewHazardService(db *gorm.DB) *HazardService {
	return &HazardService{db: db}
}

// CreateHazard creates a new hazard record in the database.
func (s *HazardService) CreateHazard(req schema.CreateHazardRequest, userID uuid.UUID) (*models.Hazard, error) {
	hazard := &models.Hazard{
		Type:              req.Type,
		RiskLevel:         req.RiskLevel,
		Status:            "new",
		Title:             req.Title,
		Description:       req.Description,
		Location:          req.Location,
		FullLocation:      req.FullLocation,
		RecommendedAction: req.RecommendedAction,
		ReportedBy:        userID,
		UserReported:      req.ReporterFullName,
	}

	if req.AssignedTo != uuid.Nil {
		hazard.AssignedTo = &req.AssignedTo
	}

	if err := s.db.Create(hazard).Error; err != nil {
		return nil, fmt.Errorf("failed to create hazard: %w", err)
	}

	return hazard, nil
}

// GetHazard retrieves a single hazard by its ID.
func (s *HazardService) GetHazard(id uuid.UUID) (*models.Hazard, error) {
	var hazard models.Hazard
	err := s.db.Preload("Reporter").Preload("Assignee").First(&hazard, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("hazard not found")
		}
		return nil, fmt.Errorf("failed to get hazard: %w", err)
	}
	return &hazard, nil
}

// ListHazards retrieves a paginated list of hazards.
func (s *HazardService) ListHazards(page, pageSize int, filters map[string]interface{}) ([]models.Hazard, int64, error) {
	var hazards []models.Hazard
	var total int64

	query := s.db.Model(&models.Hazard{}).Where("status != ?", "closed")

	// Apply filters
	for key, value := range filters {
		query = query.Where(fmt.Sprintf("%s = ?", key), value)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count hazards: %w", err)
	}

	// Get paginated results
	err := query.Preload("Reporter").Preload("Assignee").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Order("created_at DESC").
		Find(&hazards).Error

	if err != nil {
		return nil, 0, fmt.Errorf("failed to list hazards: %w", err)
	}

	return hazards, total, nil
}

// UpdateHazard updates an existing hazard's information.
func (s *HazardService) UpdateHazard(id uuid.UUID, updates schema.UpdateHazardRequest) (*models.Hazard, error) {
	var hazard models.Hazard
	if err := s.db.Preload("Reporter").Preload("Assignee").First(&hazard, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("hazard not found")
		}
		return nil, err
	}

	// Selectively update fields
	if updates.Type != nil {
		hazard.Type = *updates.Type
	}
	if updates.RiskLevel != nil {
		hazard.RiskLevel = *updates.RiskLevel
	}
	if updates.Status != nil {
		hazard.Status = *updates.Status
		if *updates.Status == "closed" {
			now := time.Now()
			hazard.ClosedAt = &now
		}
	}
	if updates.Title != nil {
		hazard.Title = *updates.Title
	}
	if updates.Description != nil {
		hazard.Description = *updates.Description
	}
	if updates.Location != nil {
		hazard.Location = *updates.Location
	}
	if updates.FullLocation != nil {
		hazard.FullLocation = *updates.FullLocation
	}
	if updates.RecommendedAction != nil {
		hazard.RecommendedAction = *updates.RecommendedAction
	}

	if updates.ReporterFullName != nil {
		hazard.UserReported = *updates.ReporterFullName
	}

	hazard.UpdatedAt = time.Now()

	if err := s.db.Save(&hazard).Error; err != nil {
		return nil, fmt.Errorf("failed to update hazard: %w", err)
	}

	return &hazard, nil
}

// DeleteHazard soft deletes a hazard from the database.
func (s *HazardService) DeleteHazard(id uuid.UUID) error {
	if err := s.db.Delete(&models.Hazard{}, id).Error; err != nil {
		return fmt.Errorf("failed to delete hazard: %w", err)
	}
	return nil
}

// AssignHazardToUser assigns a hazard to a specific user.
func (s *HazardService) AssignHazardToUser(id uuid.UUID, userID uuid.UUID) (*models.Hazard, error) {
	var hazard models.Hazard
	if err := s.db.First(&hazard, "id = ?", id).Error; err != nil {
		return nil, fmt.Errorf("failed to find hazard: %w", err)
	}

	hazard.AssignedTo = &userID

	if err := s.db.Save(&hazard).Error; err != nil {
		return nil, fmt.Errorf("failed to assign hazard: %w", err)
	}

	return &hazard, nil
}
