package services

import (
	"errors"
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

func (s *InvestigationService) GetByIncidentID(incidentID uuid.UUID) (*models.Investigation, error) {
    investigation := &models.Investigation{}
    if err := s.DB.Where("incident_id = ?", incidentID).First(investigation).Error; err != nil {
        return nil, err
    }
    return investigation, nil
}

// Create a new investigation
func (s *InvestigationService) Create(form *schema.InvestigationForm) (*models.Investigation, error) {
	investigation := models.Investigation{
		IncidentID:           form.IncidentID,
		LeadInvestigatorID:   form.LeadInvestigatorID,
		RootCause:            form.RootCause,
		ContributingFactors:  form.ContributingFactors.(models.JSONB),
		InvestigationMethods: form.InvestigationMethods.(models.JSONB),
		Findings:             form.Findings,
		Recommendations:      form.Recommendations,
		StartedAt:            form.StartedAt,
		CompletedAt:          *form.CompletedAt,
		Status:               form.Status,
		CreatedAt:            time.Now(),
		UpdatedAt:            time.Now(),
	}

	if err := s.DB.Create(&investigation).Error; err != nil {
		return nil, err
	}
	return &investigation, nil
}

// Get an investigation by ID
// func (s *InvestigationService) GetByID(id uuid.UUID) (*models.Investigation, error) {
// 	var investigation models.Investigation
// 	if err := s.DB.First(&investigation, "id = ?", id).Error; err != nil {
// 		if errors.Is(err, gorm.ErrRecordNotFound) {
// 			return nil, errors.New("investigation not found")
// 		}
// 		return nil, err
// 	}
// 	return &investigation, nil
// }
func (s *InvestigationService) GetByID(id uuid.UUID) (*models.Investigation, error) {
    investigation := &models.Investigation{}
    if err := s.DB.Preload("Incident").Preload("LeadInvestigator").First(investigation, id).Error; err != nil {
        return nil, err
    }
    return investigation, nil
}

// Update an investigation
func (s *InvestigationService) Update(id uuid.UUID, form *schema.InvestigationForm) (*models.Investigation, error) {
	var investigation models.Investigation
	if err := s.DB.First(&investigation, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("investigation not found")
		}
		return nil, err
	}

	// Update fields
	investigation.IncidentID = form.IncidentID
	investigation.LeadInvestigatorID = form.LeadInvestigatorID
	investigation.RootCause = form.RootCause
	investigation.ContributingFactors = form.ContributingFactors.(models.JSONB)
	investigation.InvestigationMethods = form.InvestigationMethods.(models.JSONB)
	investigation.Findings = form.Findings
	investigation.Recommendations = form.Recommendations
	investigation.StartedAt = form.StartedAt
	investigation.CompletedAt = *form.CompletedAt
	investigation.Status = form.Status
	investigation.UpdatedAt = time.Now()

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
