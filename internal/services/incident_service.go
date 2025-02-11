package services

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/schema"
	"gorm.io/gorm"
)

type IncidentService struct {
	db *gorm.DB
}

func NewIncidentService(db *gorm.DB) *IncidentService {
	return &IncidentService{db: db}
}

// CreateIncident creates a new incident record
func (s *IncidentService) CreateIncident(req schema.CreateIncidentRequest, userID uuid.UUID) (*models.Incident, error) {
	refNumber := generateReferenceNumber()

	incident := &models.Incident{
		ReferenceNumber:         refNumber,
		Type:                    req.Type,
		SeverityLevel:           req.SeverityLevel,
		Status:                  "new",
		Title:                   req.Title,
		Description:             req.Description,
		Location:                req.Location,
		OccurredAt:              req.OccurredAt,
		ReportedBy:              userID,
		// AssignedTo:              req.AssignedTo,
		ImmediateActionsTaken:   req.ImmediateActionsTaken,
		Witnesses:               req.Witnesses,
		EnvironmentalConditions: req.EnvironmentalConditions,
		EquipmentInvolved:       req.EquipmentInvolved,
	}

	if err := s.db.Create(incident).Error; err != nil {
		return nil, fmt.Errorf("failed to create incident: %w", err)
	}

	return incident, nil
}

// CreateIncidentWithAttachment creates an incident with an image attachment
func (s *IncidentService) CreateIncidentWithAttachment(
	req schema.CreateIncidentRequest,
	file *multipart.FileHeader,
	uploadedBy uuid.UUID,
) (*models.Incident, error) {
	// Start a transaction
	tx := s.db.Begin()
	if tx.Error != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", tx.Error)
	}

	// Create the incident first
	incident, err := s.CreateIncident(req, uploadedBy)
	if err != nil {
		tx.Rollback()
		return nil, err
	}

	// Handle file upload
	filename := filepath.Base(file.Filename)
	storagePath := fmt.Sprintf("uploads/incidents/%s/%s", incident.ID, filename)

	// Create directory if it doesn't exist
	if err := os.MkdirAll(filepath.Dir(storagePath), 0755); err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create directory: %w", err)
	}

	// Open and save the file
	src, err := file.Open()
	if err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer src.Close()

	dst, err := os.Create(storagePath)
	if err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	if _, err = io.Copy(dst, src); err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	// Create attachment record
	attachment := &models.IncidentAttachment{
		IncidentID:  incident.ID,
		FileName:    filename,
		FileType:    file.Header.Get("Content-Type"),
		FileSize:    int(file.Size),
		StoragePath: storagePath,
		UploadedBy:  uploadedBy,
	}

	if err := tx.Create(attachment).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create attachment record: %w", err)
	}

	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return incident, nil
}

// GetIncident retrieves an incident by ID
func (s *IncidentService) GetIncident(id uuid.UUID) (*models.Incident, error) {
	var incident models.Incident
	err := s.db.Preload("Reporter").Preload("Assignee").First(&incident, "id = ?", id).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get incident: %w", err)
	}
	return &incident, nil
}

// ListIncidents retrieves a paginated list of incidents
func (s *IncidentService) ListIncidents(page, pageSize int, filters map[string]interface{}) ([]models.Incident, int64, error) {
	var incidents []models.Incident
	var total int64

	query := s.db.Model(&models.Incident{})

	// Apply filters
	for key, value := range filters {
		query = query.Where(fmt.Sprintf("%s = ?", key), value)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count incidents: %w", err)
	}

	// Get paginated results
	err := query.Preload("Reporter").Preload("Assignee").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Order("created_at DESC").
		Find(&incidents).Error

	if err != nil {
		return nil, 0, fmt.Errorf("failed to list incidents: %w", err)
	}

	return incidents, total, nil
}

// UpdateIncident updates an existing incident
func (s *IncidentService) UpdateIncident(id uuid.UUID, updates map[string]interface{}) (*models.Incident, error) {
	incident, err := s.GetIncident(id)
	if err != nil {
		return nil, err
	}

	if err := s.db.Model(incident).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("failed to update incident: %w", err)
	}

	return incident, nil
}

// DeleteIncident soft deletes an incident
func (s *IncidentService) DeleteIncident(id uuid.UUID) error {
	return s.db.Delete(&models.Incident{}, id).Error
}

// GetIncidentSummary generates a summary of incidents
func (s *IncidentService) GetIncidentSummary(startDate, endDate time.Time) (*models.IncidentSummary, error) {
	var summary models.IncidentSummary

	// Get total incidents by type
	var typeCount struct {
		Injury         int64
		NearMiss       int64
		PropertyDamage int64
		Environmental  int64
		Security       int64
	}

	baseQuery := s.db.Model(&models.Incident{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate)

	err := baseQuery.Where("type = ?", "injury").Count(&typeCount.Injury).Error
	if err != nil {
		return nil, err
	}

	err = baseQuery.Where("type = ?", "near_miss").Count(&typeCount.NearMiss).Error
	if err != nil {
		return nil, err
	}

	err = baseQuery.Where("type = ?", "property_damage").Count(&typeCount.PropertyDamage).Error
	if err != nil {
		return nil, err
	}

	err = baseQuery.Where("type = ?", "environmental").Count(&typeCount.Environmental).Error
	if err != nil {
		return nil, err
	}

	err = baseQuery.Where("type = ?", "security").Count(&typeCount.Security).Error
	if err != nil {
		return nil, err
	}

	// Get severity level distribution
	var severityCount struct {
		Low      int64
		Medium   int64
		High     int64
		Critical int64
	}

	err = baseQuery.Where("severity_level = ?", "low").Count(&severityCount.Low).Error
	if err != nil {
		return nil, err
	}

	err = baseQuery.Where("severity_level = ?", "medium").Count(&severityCount.Medium).Error
	if err != nil {
		return nil, err
	}

	err = baseQuery.Where("severity_level = ?", "high").Count(&severityCount.High).Error
	if err != nil {
		return nil, err
	}

	err = baseQuery.Where("severity_level = ?", "critical").Count(&severityCount.Critical).Error
	if err != nil {
		return nil, err
	}

	// Add the counts to the summary
	summary = models.IncidentSummary{
		// Add fields as needed based on the actual IncidentSummary struct definition
	}

	return &summary, nil
}

// Helper function to generate a unique reference number
func generateReferenceNumber() string {
	timestamp := time.Now().Format("20060102")
	random := uuid.New().String()[:8]
	return fmt.Sprintf("INC-%s-%s", timestamp, random)
}
