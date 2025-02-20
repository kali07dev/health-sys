package services

import (
	"os"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"gorm.io/gorm"
)

// Add CRUD operations for IncidentAttachment
type AttachmentService struct {
	db *gorm.DB
}

func NewAttachmentService(db *gorm.DB) *AttachmentService {
	return &AttachmentService{db: db}
}

// CreateAttachment creates a new attachment
func (s *AttachmentService) CreateAttachment(attachment *models.IncidentAttachment) error {
	return s.db.Create(attachment).Error
}

// GetAttachment retrieves an attachment by ID
func (s *AttachmentService) GetAttachment(id uuid.UUID) (*models.IncidentAttachment, error) {
	var attachment models.IncidentAttachment
	err := s.db.Preload("Uploader").First(&attachment, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &attachment, nil
}

// ListAttachments retrieves all attachments for an incident
func (s *AttachmentService) ListAttachments(incidentID uuid.UUID) ([]models.IncidentAttachment, error) {
	var attachments []models.IncidentAttachment
	err := s.db.Preload("Uploader").
		Where("incident_id = ?", incidentID).
		Find(&attachments).Error
	return attachments, err
}

// DeleteAttachment deletes an attachment
func (s *AttachmentService) DeleteAttachment(id uuid.UUID) error {
	// First get the attachment to get the file path
	attachment, err := s.GetAttachment(id)
	if err != nil {
		return err
	}

	// Start a transaction
	tx := s.db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	// Delete from database
	if err := tx.Delete(&models.IncidentAttachment{}, "id = ?", id).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Delete the actual file
	if err := os.Remove(attachment.StoragePath); err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}
