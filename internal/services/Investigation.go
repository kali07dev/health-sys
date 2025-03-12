package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/schema"
	"gorm.io/gorm"
)

type InvestigationService struct {
	DB *gorm.DB
}

func NewInvestigationService(db *gorm.DB) *InvestigationService {
	return &InvestigationService{DB: db}
}

// List all investigations with interviews and evidence
func (s *InvestigationService) FullGetAll(ctx context.Context, limit, offset int) ([]schema.InvestigationResponse, error) {
	var investigations []models.Investigation
	err := s.DB.WithContext(ctx).
		Preload("Incident").
		Preload("LeadInvestigator").
		Limit(limit).
		Offset(offset).
		Find(&investigations).Error

	if err != nil {
		return nil, fmt.Errorf("failed to fetch investigations: %w", err)
	}

	// Convert to response format
	responses := make([]schema.InvestigationResponse, len(investigations))
	for i, investigation := range investigations {
		responses[i] = *schema.ConvertToInvestigationResponse(&investigation)

		// Fetch interviews for each investigation
		var interviews []models.InvestigationInterview
		if err := s.DB.WithContext(ctx).
			Preload("Interviewee").
			Where("investigation_id = ?", investigation.ID).
			Find(&interviews).Error; err == nil {

			interviewResponses := make([]schema.InvestigationInterviewResponse, len(interviews))
			for j, interview := range interviews {
				interviewResponses[j] = schema.ToInvestigationInterviewResponse(&interview)
			}
			responses[i].Interviews = interviewResponses
		}

		// Fetch evidence for each investigation
		var evidences []models.InvestigationEvidence
		if err := s.DB.WithContext(ctx).
			Preload("Collector").
			Where("investigation_id = ?", investigation.ID).
			Find(&evidences).Error; err == nil {

			evidenceResponses := make([]schema.InvestigationEvidenceResponse, len(evidences))
			for j, evidence := range evidences {
				evidenceResponses[j] = schema.ToInvestigationEvidenceResponse(&evidence)
			}
			responses[i].Evidence = evidenceResponses
		}
	}

	return responses, nil
}
func (s *InvestigationService) GetAll(status string, limit, offset int) ([]models.Investigation, error) {
	var investigations []models.Investigation

	// Start building the query
	query := s.DB.Model(&models.Investigation{})

	// Apply filters if provided
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// Apply pagination
	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	// Execute the query
	if err := query.Find(&investigations).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("no investigations found")
		}
		return nil, err
	}

	return investigations, nil
}
func (s *InvestigationService) CloseInvestigation(id uuid.UUID) error {
	// Fetch the investigation
	var investigation models.Investigation
	if err := s.DB.First(&investigation, "id = ?", id).Error; err != nil {
		return fmt.Errorf("investigation not found: %w", err)
	}

	// Check if the investigation is already closed
	if investigation.Status == "completed" {
		return fmt.Errorf("investigation is already closed")
	}

	// Update the investigation status and set the completion time
	now := time.Now()
	investigation.Status = "completed"
	investigation.CompletedAt = &now

	// Save the updated investigation
	if err := s.DB.Save(&investigation).Error; err != nil {
		return fmt.Errorf("failed to close investigation: %w", err)
	}

	return nil
}

func (s *InvestigationService) FullGetByIncidentID(ctx context.Context, incidentID uuid.UUID) (*schema.InvestigationResponse, error) {
	var investigation models.Investigation
	err := s.DB.WithContext(ctx).
		Preload("Incident").
		Preload("LeadInvestigator").
		Where("incident_id = ?", incidentID).
		First(&investigation).Error

	if err != nil {
		return nil, fmt.Errorf("investigation not found for incident: %w", err)
	}

	// Use GetByID to get full details including interviews and evidence
	return s.FullGetByID(ctx, investigation.ID)
}
func (s *InvestigationService) GetByIncidentID(incidentID uuid.UUID) (*models.Investigation, error) {
	investigation := &models.Investigation{}
	if err := s.DB.Where("incident_id = ?", incidentID).First(investigation).Error; err != nil {
		return nil, err
	}
	return investigation, nil
}
func (s *InvestigationService) GetAllByEmployeeID(employeeID uuid.UUID) ([]models.Investigation, error) {
    var investigations []models.Investigation
    
    result := s.DB.Preload("Incident").Preload("LeadInvestigator").Where("lead_investigator_id = ?", employeeID).Find(&investigations)
    
    if result.Error != nil {
        return nil, result.Error
    }
    
    return investigations, nil
}
// Create a new investigation
func (s *InvestigationService) Create(form *schema.InvestigationForm) (*models.Investigation, error) {
	// Start a transaction
	tx := s.DB.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}

	// Create the investigation
	investigation := models.Investigation{
		IncidentID:         form.IncidentID,
		LeadInvestigatorID: form.LeadInvestigatorID,
		StartedAt:          form.StartedAt,
		Status:             "in_progress",
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	if err := tx.Create(&investigation).Error; err != nil {
		tx.Rollback() // Rollback the transaction in case of error
		return nil, err
	}

	// Update the incident status to 'investigating'
	if err := tx.Model(&models.Incident{}).
		Where("id = ?", form.IncidentID).
		Update("status", "investigating").Error; err != nil {
		tx.Rollback() // Rollback the transaction in case of error
		return nil, err
	}

	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return &investigation, nil
}

// Get an investigation by ID
func (s *InvestigationService) GetByID(id uuid.UUID) (*models.Investigation, error) {
	investigation := &models.Investigation{}
	if err := s.DB.Preload("Incident").Preload("LeadInvestigator").First(investigation, id).Error; err != nil {
		return nil, err
	}
	return investigation, nil
}
func (s *InvestigationService) FullGetByID(ctx context.Context, id uuid.UUID) (*schema.InvestigationResponse, error) {
	var investigation models.Investigation
	err := s.DB.WithContext(ctx).
		Preload("Incident").
		Preload("LeadInvestigator").
		First(&investigation, "id = ?", id).Error

	if err != nil {
		return nil, fmt.Errorf("investigation not found: %w", err)
	}

	// Convert to response
	response := schema.ConvertToInvestigationResponse(&investigation)

	// Fetch interviews
	var interviews []models.InvestigationInterview
	if err := s.DB.WithContext(ctx).
		Preload("Interviewee").
		Where("investigation_id = ?", id).
		Find(&interviews).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch interviews: %w", err)
	}

	// Add interviews to response
	interviewResponses := make([]schema.InvestigationInterviewResponse, len(interviews))
	for i, interview := range interviews {
		interviewResponses[i] = schema.ToInvestigationInterviewResponse(&interview)
	}
	response.Interviews = interviewResponses

	// Fetch evidence
	var evidences []models.InvestigationEvidence
	if err := s.DB.WithContext(ctx).
		Preload("Collector").
		Where("investigation_id = ?", id).
		Find(&evidences).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch evidence: %w", err)
	}

	// Add evidence to response
	evidenceResponses := make([]schema.InvestigationEvidenceResponse, len(evidences))
	for i, evidence := range evidences {
		evidenceResponses[i] = schema.ToInvestigationEvidenceResponse(&evidence)
	}
	response.Evidence = evidenceResponses

	return response, nil
}
func (s *InvestigationService) GetEmployeeByID(empID uuid.UUID) (*models.Employee, error) {
	var employee models.Employee

	err := s.DB.Preload("User").First(&employee, "id = ?", empID).Error
	if err != nil {
		return nil, err
	}
	return &employee, nil
}
func (r *InvestigationService) GetEmployeeByUserID(userID uuid.UUID) (*models.Employee, error) {
	var employee models.Employee

	// Query the database for the employee with the given UserID
	result := r.DB.Where("user_id = ?", userID).First(&employee)
	if result.Error != nil {
		return nil, result.Error
	}

	// Return the retrieved employee
	return &employee, nil
}

// Update an investigation
func (s *InvestigationService) Update(id uuid.UUID, form *schema.FlexibleInvestigationForm) (*models.Investigation, error) {
	// Retrieve existing investigation
	var investigation models.Investigation
	if err := s.DB.First(&investigation, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("investigation not found")
		}
		return nil, err
	}

	// Convert the original form to the flexible form
	flexForm := &schema.FlexibleInvestigationForm{}
	jsonData, err := json.Marshal(form)
	if err != nil {
		return nil, fmt.Errorf("failed to process form data: %v", err)
	}
	if err := json.Unmarshal(jsonData, flexForm); err != nil {
		return nil, fmt.Errorf("failed to process form data: %v", err)
	}

	// Selectively update fields
	if flexForm.IncidentID != nil && *flexForm.IncidentID != uuid.Nil {
		investigation.IncidentID = *flexForm.IncidentID
	}

	if flexForm.LeadInvestigatorID != nil && *flexForm.LeadInvestigatorID != uuid.Nil {
		investigation.LeadInvestigatorID = *flexForm.LeadInvestigatorID
	}

	if flexForm.RootCause != nil {
		investigation.RootCause = *flexForm.RootCause
	}

	if flexForm.Description != nil {
		investigation.Description = *flexForm.Description
	}

	// Handle ContributingFactors as an array
	if len(flexForm.ContributingFactors) > 0 {
		investigation.ContributingFactors = models.JSONB{
			"factors": flexForm.ContributingFactors,
		}
	}

	// Handle InvestigationMethods as an array
	if len(flexForm.InvestigationMethods) > 0 {
		investigation.InvestigationMethods = models.JSONB{
			"methods": flexForm.InvestigationMethods,
		}
	}

	if flexForm.Findings != nil {
		investigation.Findings = *flexForm.Findings
	}

	if flexForm.Recommendations != nil {
		investigation.Recommendations = *flexForm.Recommendations
	}

	if flexForm.StartedAt != nil && !flexForm.StartedAt.IsZero() {
		investigation.StartedAt = *flexForm.StartedAt
	}

	if flexForm.CompletedAt != nil && !flexForm.CompletedAt.IsZero() {
		investigation.CompletedAt = flexForm.CompletedAt
	}

	if flexForm.Status != nil {
		investigation.Status = *flexForm.Status
	}

	investigation.UpdatedAt = time.Now()
	investigation.Status = "pending_review"

	if err := s.DB.Save(&investigation).Error; err != nil {
		return nil, err
	}
	return &investigation, nil
}

// Delete an investigation
func (s *InvestigationService) Delete(id uuid.UUID) error {
	var investigation models.Investigation
	if err := s.DB.First(&investigation, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("investigation not found")
		}
		return err
	}

	if err := s.DB.Delete(&investigation).Error; err != nil {
		return err
	}
	return nil
}
