package services

import (
	"errors"
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

func (r *IncidentService) GetEmployeeByUserID(userID uuid.UUID) (*models.Employee, error) {
	var employee models.Employee

	// Query the database for the employee with the given UserID
	result := r.db.Where("user_id = ?", userID).First(&employee)
	if result.Error != nil {
		return nil, result.Error
	}

	// Return the retrieved employee
	return &employee, nil
}
func (s *IncidentService) GetClosedIncidentsByEmployeeID(employeeID uuid.UUID, page, pageSize int) ([]models.Incident, int64, error) {
	var incidents []models.Incident
	var total int64

	query := s.db.Model(&models.Incident{}).
		Where("status = ? AND (reported_by = ? OR assigned_to = ?)", "closed", employeeID, employeeID)

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count closed incidents for employee: %w", err)
	}

	// Get paginated results
	err := query.Preload("Reporter").Preload("Assignee").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Order("closed_at DESC").
		Find(&incidents).Error

	if err != nil {
		return nil, 0, fmt.Errorf("failed to get closed incidents for employee: %w", err)
	}

	return incidents, total, nil
}
func (s *IncidentService) GetByEmployeeID(employeeID uuid.UUID) ([]models.Incident, error) {
	var incidents []models.Incident
	err := s.db.Preload("Reporter").Preload("Assignee").
		Where("reported_by = ? AND status != ?", employeeID, "closed").
		Find(&incidents).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get incidents by employee ID: %w", err)
	}
	return incidents, nil
}

// CreateIncident creates a new incident record
func (s *IncidentService) CreateIncident(req schema.CreateIncidentRequest, userID uuid.UUID) (*models.Incident, error) {
	// refNumber := generateReferenceNumber()

	// if req.Type == "injury" && req.InjuryType == "" {
	// 	return nil, fmt.Errorf("injury type is required for injury incidents")
	// }
	incident := &models.Incident{
		// ReferenceNumber: refNumber,
		UserIncidentID: req.UserIncidentID,
		FullLocation:   req.FullLocation,
		Type:           req.Type,
		InjuryType:     req.InjuryType,
		SeverityLevel:  req.SeverityLevel,
		LateReason:     req.LateReason,
		Status:         "new",
		Title:          req.Title,
		Description:    req.Description,
		Location:       req.Location,
		OccurredAt:     req.OccurredAt,
		ReportedBy:     userID,
		UserReported:   req.ReporterFullName,
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
	files []*multipart.FileHeader,
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

	// Loop through each file and handle the upload
	for _, file := range files {
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
	}

	// Commit the transaction
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

	query := s.db.Model(&models.Incident{}).Where("status != ?", "closed")

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
func (s *IncidentService) ListClosedIncidents(page, pageSize int, filters map[string]interface{}) ([]models.Incident, int64, error) {
	var incidents []models.Incident
	var total int64

	query := s.db.Model(&models.Incident{}).Where("status = ?", "closed")

	// Apply additional filters
	for key, value := range filters {
		query = query.Where(fmt.Sprintf("%s = ?", key), value)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count closed incidents: %w", err)
	}

	// Get paginated results
	err := query.Preload("Reporter").Preload("Assignee").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Order("closed_at DESC").
		Find(&incidents).Error

	if err != nil {
		return nil, 0, fmt.Errorf("failed to list closed incidents: %w", err)
	}

	return incidents, total, nil
}

// UpdateIncident updates an existing incident
func (s *IncidentService) UpdateIncident(id uuid.UUID, updates schema.UpdateIncidentRequest) (*models.Incident, error) {
    // Retrieve existing incident
    var incident models.Incident
    if err := s.db.Preload("Reporter").Preload("Assignee").First(&incident, "id = ?", id).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, fmt.Errorf("incident not found")
        }
        return nil, err
    }

    // Validate injury type if incident type is being updated to injury
    if updates.Type != nil && *updates.Type == "injury" && (updates.InjuryType == nil || *updates.InjuryType == "") {
        return nil, fmt.Errorf("injury type is required for injury incidents")
    }

    // Selectively update fields
    if updates.Type != nil {
        incident.Type = *updates.Type
    }

    if updates.InjuryType != nil {
        incident.InjuryType = *updates.InjuryType
    }

    if updates.SeverityLevel != nil {
        incident.SeverityLevel = *updates.SeverityLevel
    }

    if updates.Title != nil {
        incident.Title = *updates.Title
    }

    if updates.Description != nil {
        incident.Description = *updates.Description
    }

    if updates.Location != nil {
        incident.Location = *updates.Location
    }

    if updates.FullLocation != nil {
        incident.FullLocation = *updates.FullLocation
    }

    if updates.Status != nil {
        incident.Status = *updates.Status
        if *updates.Status == "closed" {
            now := time.Now()
            incident.ClosedAt = &now
        }
    }

    if updates.ReporterFullName != nil {
        incident.UserReported = *updates.ReporterFullName
    }

    if updates.LateReason != nil {
        incident.LateReason = *updates.LateReason
    }

    if updates.UserIncidentID != nil {
        incident.UserIncidentID = *updates.UserIncidentID
    }

    if updates.OccurredAt != nil {
        incident.OccurredAt = *updates.OccurredAt
    }

    if updates.ImmediateActionsTaken != nil {
        incident.ImmediateActionsTaken = *updates.ImmediateActionsTaken
    }

    if updates.Witnesses != nil {
        incident.Witnesses = models.JSONB(*updates.Witnesses)
    }

    if updates.EnvironmentalConditions != nil {
        incident.EnvironmentalConditions = models.JSONB(*updates.EnvironmentalConditions)
    }

    if updates.EquipmentInvolved != nil {
        incident.EquipmentInvolved = models.JSONB(*updates.EquipmentInvolved)
    }

    incident.UpdatedAt = time.Now()

    if err := s.db.Save(&incident).Error; err != nil {
        return nil, fmt.Errorf("failed to update incident: %w", err)
    }

    return &incident, nil
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

// CloseIncident closes an incident by setting its status to "closed" and updating the ClosedAt field
func (s *IncidentService) CloseIncident(id uuid.UUID) (*models.Incident, error) {
	var incident models.Incident
	err := s.db.First(&incident, "id = ?", id).Error
	if err != nil {
		return nil, fmt.Errorf("failed to find incident: %w", err)
	}

	incident.Status = "closed"
	now := time.Now()
	incident.ClosedAt = &now

	err = s.db.Save(&incident).Error
	if err != nil {
		return nil, fmt.Errorf("failed to close incident: %w", err)
	}

	return &incident, nil
}



// AssignIncidentToUser assigns an incident to a user by updating the AssignedTo field
func (s *IncidentService) AssignIncidentToUser(id uuid.UUID, userID uuid.UUID) (*models.Incident, error) {
	var incident models.Incident
	err := s.db.First(&incident, "id = ?", id).Error
	if err != nil {
		return nil, fmt.Errorf("failed to find incident: %w", err)
	}

	incident.AssignedTo = &userID

	err = s.db.Save(&incident).Error
	if err != nil {
		return nil, fmt.Errorf("failed to assign incident: %w", err)
	}

	return &incident, nil
}

func (s *IncidentService) FilterListIncidents(
	page, pageSize int,
	filters map[string]interface{},
) ([]models.Incident, int64, error) {
	var incidents []models.Incident
	var total int64

	query := s.db.Model(&models.Incident{})

	// Apply filters
	for key, value := range filters {
		switch key {
		case "start_date":
			query = query.Where("occurred_at >= ?", value)
		case "end_date":
			query = query.Where("occurred_at <= ?", value)
		default:
			query = query.Where(fmt.Sprintf("%s = ?", key), value)
		}
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count incidents: %w", err)
	}

	// Paginate and fetch results
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

func (s *IncidentService) UpdateIncidentStatus(id uuid.UUID, status string) (*models.Incident, error) {
	var incident models.Incident
	err := s.db.First(&incident, "id = ?", id).Error
	if err != nil {
		return nil, fmt.Errorf("failed to find incident: %w", err)
	}

	incident.Status = status
	if status == "closed" {
		now := time.Now()
		incident.ClosedAt = &now
	}

	err = s.db.Save(&incident).Error
	if err != nil {
		return nil, fmt.Errorf("failed to update incident status: %w", err)
	}

	return &incident, nil
}

// Helper function to generate a unique reference number
func generateReferenceNumber() string {
	timestamp := time.Now().Format("20060102")
	random := uuid.New().String()[:8]
	return fmt.Sprintf("INC-%s-%s", timestamp, random)
}
