package services

import (
	"context"
	"errors"
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

func (s *CorrectiveActionService) GetByEmployeeID(employeeID uuid.UUID) ([]models.CorrectiveAction, error) {
	var actions []models.CorrectiveAction
	err := s.db.Preload("Incident").
		Preload("Assignee").
		Preload("Assigner").
		Preload("Verifier").
		Where("assigned_to = ?", employeeID).
		Find(&actions).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get corrective actions by employee ID: %w", err)
	}
	return actions, nil
}
func (s *CorrectiveActionService) GetByIncidentID(incidentID uuid.UUID) ([]models.CorrectiveAction, error) {
	var actions []models.CorrectiveAction
	if err := s.db.Where("incident_id = ?", incidentID).Find(&actions).Error; err != nil {
		return nil, err
	}
	return actions, nil
}
func (r *CorrectiveActionService) GetEmployeeByUserID(userID uuid.UUID) (*models.Employee, error) {
	var employee models.Employee

	// Query the database for the employee with the given UserID
	result := r.db.Where("user_id = ?", userID).First(&employee)
	if result.Error != nil {
		return nil, result.Error
	}

	// Return the retrieved employee
	return &employee, nil
}

// Create a new corrective action
func (s *CorrectiveActionService) Create(ctx context.Context, req schema.CorrectiveActionRequest, empID uuid.UUID) (*models.CorrectiveAction, error) {
	// Start a database transaction
	tx := s.db.WithContext(ctx).Begin()
	if tx.Error != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", tx.Error)
	}

	// Defer rollback in case anything fails - will be a no-op if transaction is committed
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	validate := validator.New()
	if err := validate.Struct(req); err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	incidentID, _ := uuid.Parse(req.IncidentID)
	assignedTo, _ := uuid.Parse(req.AssignedTo)
	// assignedBy, _ := uuid.Parse(req.AssignedBy)

	dueDate, err := time.Parse(time.RFC3339, req.DueDate)
	if err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("invalid due_date format: %w", err)
	}

	correctiveAction := &models.CorrectiveAction{
		IncidentID:           incidentID,
		Description:          req.Description,
		ActionType:           req.ActionType,
		Priority:             req.Priority,
		Status:               req.Status, // Database default will handle if empty
		AssignedTo:           assignedTo,
		AssignedBy:           empID,
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
			correctiveAction.VerifiedBy = &verifiedBy
		}
	}

	if req.VerifiedAt != "" {
		if verifiedAt, err := time.Parse(time.RFC3339, req.VerifiedAt); err == nil {
			correctiveAction.VerifiedAt = verifiedAt
		}
	}

	// Create the corrective action
	if err := tx.Create(correctiveAction).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Update the incident status to 'action_required'
	if err := tx.Model(&models.Incident{}).
		Where("id = ?", incidentID).
		Update("status", "action_required").
		Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to update incident status: %w", err)
	}

	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
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
func (s *CorrectiveActionService) Update(ctx context.Context, id uuid.UUID, req schema.UpdateCorrectiveActionRequest) (*models.CorrectiveAction, error) {
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
			action.VerifiedBy = &verifiedBy
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

func (s *CorrectiveActionService) CreateActionEvidence(evidence *models.ActionEvidence) error {
	// Validate required fields
	if evidence.CorrectiveActionID == uuid.Nil || evidence.FileType == "" || evidence.FileName == "" || evidence.FileURL == "" || evidence.UploadedBy == uuid.Nil {
		return fmt.Errorf("missing required fields")
	}

	// Create the record
	result := s.db.Create(evidence)
	if result.Error != nil {
		return result.Error
	}

	return nil
}
func (s *CorrectiveActionService) GetActionEvidenceByID(id uuid.UUID) (*models.ActionEvidence, error) {
	var evidence models.ActionEvidence

	// Fetch the record by ID
	result := s.db.Preload("CorrectiveAction").Preload("Uploader").First(&evidence, "id = ?", id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("action evidence not found")
		}
		return nil, result.Error
	}

	return &evidence, nil
}

func (s *CorrectiveActionService) GetActionEvidenceByCorrectiveActionID(correctiveActionID uuid.UUID) ([]models.ActionEvidence, error) {
	var evidences []models.ActionEvidence

	// Fetch all records by CorrectiveActionID
	result := s.db.Preload("CorrectiveAction").Preload("Uploader").Where("corrective_action_id = ?", correctiveActionID).Find(&evidences)
	if result.Error != nil {
		return nil, result.Error
	}

	return evidences, nil
}

func (s *CorrectiveActionService) VerifyCompletion(ctx context.Context, actionID uuid.UUID, verifierID uuid.UUID) error {
	// Begin a transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Fetch the corrective action by ID
	action, err := s.GetByID(ctx, actionID)
	if err != nil {
		tx.Rollback() // Rollback in case of an error
		return err
	}

	// Update the corrective action status
	action.Status = "verified"
	action.VerifiedBy = &verifierID
	action.VerifiedAt = time.Now()

	if err := tx.Save(action).Error; err != nil {
		tx.Rollback() // Rollback in case of an error
		return fmt.Errorf("failed to verify corrective action: %w", err)
	}

	// Fetch the associated incident
	var incident models.Incident
	if err := tx.First(&incident, "id = ?", action.IncidentID).Error; err != nil {
		tx.Rollback() // Rollback in case of an error
		return fmt.Errorf("failed to find incident: %w", err)
	}

	// Update the incident status
	incident.Status = "resolved"
	incident.ClosedAt = time.Now()

	if err := tx.Save(&incident).Error; err != nil {
		tx.Rollback() // Rollback in case of an error
		return fmt.Errorf("failed to update incident: %w", err)
	}

	// Commit the transaction if everything is successful
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}
