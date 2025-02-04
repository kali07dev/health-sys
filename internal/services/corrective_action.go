package services

import (
	"context"
	"fmt"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/schema"
	"gorm.io/gorm"
)

type CorrectiveActionService struct {
	db *gorm.DB
}

func NewCorrectiveActionService(db *gorm.DB) *CorrectiveActionService {
	return &CorrectiveActionService{db: db}
}

// Create a new corrective action
func (s *CorrectiveActionService) Create(ctx context.Context, req schema.CorrectiveActionRequest) (*models.CorrectiveAction, error) {
	validate := validator.New()
	if err := validate.Struct(req); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	incidentID, _ := uuid.Parse(req.IncidentID)
	assignedTo, _ := uuid.Parse(req.AssignedTo)
	assignedBy, _ := uuid.Parse(req.AssignedBy)

	dueDate, err := time.Parse(time.RFC3339, req.DueDate)
	if err != nil {
		return nil, fmt.Errorf("invalid due_date format: %w", err)
	}

	correctiveAction := &models.CorrectiveAction{
		IncidentID:           incidentID,
		Description:          req.Description,
		ActionType:           req.ActionType,
		Priority:             req.Priority,
		Status:               req.Status, // Database default will handle if empty
		AssignedTo:           assignedTo,
		AssignedBy:           assignedBy,
		DueDate:              dueDate,
		VerificationRequired: req.VerificationRequired,
	}

	// Handle optional fields
	if req.CompletedAt != "" {
		if completedAt, err := time.Parse(time.RFC3339, req.CompletedAt); err == nil {
			correctiveAction.CompletedAt = completedAt
		}
	}

	if req.CompletionNotes != "" {
		correctiveAction.CompletionNotes = req.CompletionNotes
	}

	if req.VerifiedBy != "" {
		if verifiedBy, err := uuid.Parse(req.VerifiedBy); err == nil {
			correctiveAction.VerifiedBy = verifiedBy
		}
	}

	if req.VerifiedAt != "" {
		if verifiedAt, err := time.Parse(time.RFC3339, req.VerifiedAt); err == nil {
			correctiveAction.VerifiedAt = verifiedAt
		}
	}

	if err := s.db.WithContext(ctx).Create(correctiveAction).Error; err != nil {
		return nil, fmt.Errorf("database error: %w", err)
	}

	return correctiveAction, nil
}

// Get corrective action by ID
func (s *CorrectiveActionService) GetByID(ctx context.Context, id uuid.UUID) (*models.CorrectiveAction, error) {
	var action models.CorrectiveAction
	err := s.db.WithContext(ctx).
		Preload("Incident").
		Preload("Assignee").
		Preload("Assigner").
		Preload("Verifier").
		First(&action, "id = ?", id).Error

	if err != nil {
		return nil, fmt.Errorf("record not found: %w", err)
	}
	return &action, nil
}

// Update existing corrective action
func (s *CorrectiveActionService) Update(ctx context.Context, id uuid.UUID, req schema.CorrectiveActionRequest) (*models.CorrectiveAction, error) {
	validate := validator.New()
	if err := validate.Struct(req); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	var action models.CorrectiveAction
	if err := s.db.WithContext(ctx).First(&action, "id = ?", id).Error; err != nil {
		return nil, fmt.Errorf("record not found: %w", err)
	}

	// Update fields
	if req.IncidentID != "" {
		if incidentID, err := uuid.Parse(req.IncidentID); err == nil {
			action.IncidentID = incidentID
		}
	}

	if req.Description != "" {
		action.Description = req.Description
	}

	if req.ActionType != "" {
		action.ActionType = req.ActionType
	}

	if req.Priority != "" {
		action.Priority = req.Priority
	}

	if req.Status != "" {
		action.Status = req.Status
	}

	if req.AssignedTo != "" {
		if assignedTo, err := uuid.Parse(req.AssignedTo); err == nil {
			action.AssignedTo = assignedTo
		}
	}

	if req.AssignedBy != "" {
		if assignedBy, err := uuid.Parse(req.AssignedBy); err == nil {
			action.AssignedBy = assignedBy
		}
	}

	if req.DueDate != "" {
		if dueDate, err := time.Parse(time.RFC3339, req.DueDate); err == nil {
			action.DueDate = dueDate
		}
	}

	// Handle completion fields
	if req.CompletedAt != "" {
		if completedAt, err := time.Parse(time.RFC3339, req.CompletedAt); err == nil {
			action.CompletedAt = completedAt
		}
	}

	action.CompletionNotes = req.CompletionNotes
	action.VerificationRequired = req.VerificationRequired

	if req.VerifiedBy != "" {
		if verifiedBy, err := uuid.Parse(req.VerifiedBy); err == nil {
			action.VerifiedBy = verifiedBy
		}
	}

	if req.VerifiedAt != "" {
		if verifiedAt, err := time.Parse(time.RFC3339, req.VerifiedAt); err == nil {
			action.VerifiedAt = verifiedAt
		}
	}

	if err := s.db.WithContext(ctx).Save(&action).Error; err != nil {
		return nil, fmt.Errorf("update failed: %w", err)
	}

	return &action, nil
}

// Delete corrective action
func (s *CorrectiveActionService) Delete(ctx context.Context, id uuid.UUID) error {
	result := s.db.WithContext(ctx).Delete(&models.CorrectiveAction{}, "id = ?", id)
	if result.Error != nil {
		return fmt.Errorf("delete failed: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
