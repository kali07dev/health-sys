package services

import (
	"errors"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"os"
	"path/filepath"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/schema"
	"github.com/hopkali04/health-sys/internal/utils"
	"gorm.io/gorm"
)

// VPCService handles business logic for VPC operations
type VPCService struct {
	db          *gorm.DB
	mailService *EmailService
}

// NewVPCService creates a new VPC service instance
func NewVPCService(db *gorm.DB, emailSvc *EmailService) *VPCService {
	return &VPCService{
		db:          db,
		mailService: emailSvc,
	}
}
func (r *VPCService) GetEmployeeByUserID(userID uuid.UUID) (*models.Employee, error) {
	var employee models.Employee

	// Query the database for the employee with the given UserID
	result := r.db.Where("user_id = ?", userID).First(&employee)
	if result.Error != nil {
		return nil, result.Error
	}

	// Return the retrieved employee
	return &employee, nil
}
func (s *VPCService) getAdminAndSafetyOfficerEmails() ([]string, error) {
	var users []models.User
	err := s.db.Table("users").
		Joins("JOIN employees ON employees.user_id = users.id").
		Where("(employees.role = ? OR employees.role = ?) AND employees.is_active = ?", "admin", "safety_officer", true).
		Select("users.email").
		Find(&users).Error

	if err != nil {
		return nil, fmt.Errorf("failed to query admins and safety officers: %v", err)
	}

	emails := make([]string, 0, len(users))
	for _, user := range users {
		if user.Email != "" {
			emails = append(emails, user.Email)
		}
	}

	return emails, nil
}

// Create creates a new VPC record
func (s *VPCService) Create(vpc *models.VPC) error {
	return s.db.Create(vpc).Error
}

func (s *VPCService) CreateVPCWithAttachments(
	reqData schema.VPCRequest_new,
	files []*multipart.FileHeader,
	creatorEmployeeID uuid.UUID,
) (*models.VPC, error) {

	tx := s.db.Begin()
	if tx.Error != nil {
		utils.LogError("Failed to begin database transaction for VPC creation", map[string]interface{}{"error": tx.Error})
		return nil, fmt.Errorf("failed to begin transaction: %w", tx.Error)
	}

	// Create the VPC record

	vpc := reqData.ToModel(creatorEmployeeID) // Pass employee ID for CreatedBy field
	if err := tx.Create(&vpc).Error; err != nil {
		tx.Rollback()
		utils.LogError("Failed to create VPC record in DB", map[string]interface{}{"error": err, "vpcData": reqData})
		return nil, fmt.Errorf("failed to create VPC record: %w", err)
	}

	// Handle attachments if any are provided
	if len(files) > 0 {
		// Define base path for VPC uploads
		baseUploadPath := "uploads/vpcs" // Consider making this configurable

		// Ensure the VPC-specific directory exists: uploads/vpcs/<vpc_id>/
		vpcUploadDir := filepath.Join(baseUploadPath, vpc.ID)
		if err := os.MkdirAll(vpcUploadDir, 0755); err != nil {
			tx.Rollback()
			utils.LogError("Failed to create VPC attachment directory", map[string]interface{}{"path": vpcUploadDir, "error": err})
			return nil, fmt.Errorf("failed to create directory '%s': %w", vpcUploadDir, err)
		}

		for _, fileHeader := range files {
			// Sanitize filename to prevent path traversal and use only the base name
			fileName := filepath.Base(fileHeader.Filename)
			storagePath := filepath.Join(vpcUploadDir, fileName)

			src, err := fileHeader.Open()
			if err != nil {
				tx.Rollback()
				utils.LogError("Failed to open uploaded file", map[string]interface{}{"filename": fileHeader.Filename, "error": err})
				return nil, fmt.Errorf("failed to open file '%s': %w", fileHeader.Filename, err)
			}

			dst, err := os.Create(storagePath)
			if err != nil {
				src.Close() // Important to close src if dst creation fails
				tx.Rollback()
				utils.LogError("Failed to create destination file on server", map[string]interface{}{"path": storagePath, "error": err})
				return nil, fmt.Errorf("failed to create file at '%s': %w", storagePath, err)
			}

			if _, err = io.Copy(dst, src); err != nil {
				src.Close()
				dst.Close() // Close dst even on copy error
				tx.Rollback()
				utils.LogError("Failed to save (copy) uploaded file to disk", map[string]interface{}{"filename": fileName, "path": storagePath, "error": err})
				return nil, fmt.Errorf("failed to save file '%s': %w", fileName, err)
			}
			src.Close()
			dst.Close()

			// Determine file type for storage; use Content-Type from header or infer from extension.
			// fileHeader.Header.Get("Content-Type") is good, or use utils.GetFileContentType(fileName) as a fallback/override.
			fileType := fileHeader.Header.Get("Content-Type")
			if fileType == "" { // Fallback if Content-Type header is missing
				fileType = utils.GetFileContentType(fileName)
			}

			// Create VPCAttachment record
			attachment := models.VPCAttachment{
				VPCID:       vpc.ID,
				FileName:    fileName,
				FileType:    fileType,
				FileSize:    int(fileHeader.Size),
				StoragePath: storagePath, // Store relative or absolute path as per your strategy
				UploadedBy:  creatorEmployeeID,
			}

			if err := tx.Create(&attachment).Error; err != nil {
				tx.Rollback()
				utils.LogError("Failed to create VPC attachment record in DB", map[string]interface{}{"attachment_filename": fileName, "error": err})
				return nil, fmt.Errorf("failed to create attachment record for '%s': %w", fileName, err)
			}
			// Optionally append to a slice if you need to manually add to vpc.Attachments later,
			// but GORM Preload is preferred for fetching.
		}
	}

	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		utils.LogError("Failed to commit transaction for VPC creation with attachments", map[string]interface{}{"error": err})
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Reload the VPC with its associations for a complete response object
	// This ensures Creator (Employee model) and Attachments (with their Uploader Employee model) are populated.
	var reloadedVPC models.VPC
	err := s.db.
		Preload("Creator").              // Preloads the models.Employee linked by vpc.CreatedBy
		Preload("Attachments").          // Preloads []models.VPCAttachment
		Preload("Attachments.Uploader"). // For each attachment, preloads its models.Employee Uploader
		First(&reloadedVPC, "id = ?", vpc.ID).Error

	if err != nil {
		utils.LogError("Failed to reload VPC with associations after creation", map[string]interface{}{"vpcID": vpc.ID, "error": err})
		return &vpc, fmt.Errorf("VPC created but failed to reload with associations: %w", err) // Or return &vpc, nil and log
	}

	utils.LogInfo("VPC and attachments (if any) successfully created and reloaded.", map[string]interface{}{"vpcID": reloadedVPC.ID})
	return &reloadedVPC, nil
}

// CreateBulk creates multiple VPC records
func (s *VPCService) CreateBulk(vpcs []models.VPC) error {
	return s.db.Create(&vpcs).Error
}

// Get retrieves a VPC by ID
func (s *VPCService) Get(id string) (*models.VPC, error) {
	var vpc models.VPC
	result := s.db.Where("id = ?", id).First(&vpc)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("vpc not found")
		}
		return nil, result.Error
	}
	return &vpc, nil
}

// GetByVpcNumber retrieves a VPC by VPC number
func (s *VPCService) GetByVpcNumber(vpcNumber string) (*models.VPC, error) {
	var vpc models.VPC
	result := s.db.Where("vpc_number = ?", vpcNumber).First(&vpc)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("vpc not found")
		}
		return nil, result.Error
	}
	return &vpc, nil
}

// ListAll retrieves all VPCs with pagination
func (s *VPCService) ListAll(page, pageSize int) ([]models.VPC, int64, error) {
	var vpcs []models.VPC
	var totalCount int64

	// Get total count
	if err := s.db.Model(&models.VPC{}).Count(&totalCount).Error; err != nil {
		return nil, 0, err
	}

	// Calculate offset
	offset := (page - 1) * pageSize

	// Get paginated results
	err := s.db.Offset(offset).Limit(pageSize).Find(&vpcs).Error
	return vpcs, totalCount, err
}
func (s *VPCService) ListAllWithAttachments(page, pageSize int) ([]models.VPC, int64, error) {
	var vpcs []models.VPC
	var totalCount int64

	// Create a base query for counting and fetching to ensure consistency
	query := s.db.Model(&models.VPC{})

	// Get total count
	if err := query.Count(&totalCount).Error; err != nil {
		utils.LogError("Failed to count VPCs", map[string]interface{}{"error": err.Error()})
		return nil, 0, err
	}

	// Calculate offset
	offset := (page - 1) * pageSize
	if offset < 0 { // Ensure offset is not negative if page is 0 or 1
		offset = 0
	}

	err := s.db.Model(&models.VPC{}). // Explicitly state the model again for the find query with preloads
						Preload("Creator").
						Preload("Attachments").
						Preload("Attachments.Uploader"). // GORM handles preloading nested associations
						Order("created_at DESC").        // Optional: Order by creation date or another relevant field
						Offset(offset).
						Limit(pageSize).
						Find(&vpcs).Error

	if err != nil {
		utils.LogError("Failed to list VPCs with attachments", map[string]interface{}{
			"page":     page,
			"pageSize": pageSize,
			"error":    err.Error(),
		})
		return nil, 0, err
	}


	return vpcs, totalCount, nil
}

// Update updates an existing VPC
func (s *VPCService) Update(vpc *models.VPC) error {
	// Check if the VPC exists
	var exists models.VPC
	result := s.db.Where("id = ?", vpc.ID).First(&exists)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return errors.New("vpc not found")
		}
		return result.Error
	}

	// Update the VPC
	return s.db.Save(vpc).Error
}

// Delete deletes a VPC by ID
func (s *VPCService) Delete(id string) error {
	result := s.db.Delete(&models.VPC{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("vpc not found")
	}
	return nil
}

// ListByDepartment retrieves VPCs for a specific department with pagination
func (s *VPCService) ListByDepartment(department string, page, pageSize int) ([]models.VPC, int64, error) {
	var vpcs []models.VPC
	var totalCount int64

	// Get total count for this department
	if err := s.db.Model(&models.VPC{}).Where("department = ?", department).Count(&totalCount).Error; err != nil {
		return nil, 0, err
	}

	// Calculate offset
	offset := (page - 1) * pageSize

	// Get paginated results
	err := s.db.Where("department = ?", department).Offset(offset).Limit(pageSize).Find(&vpcs).Error
	return vpcs, totalCount, err
}

// ListByVpcType retrieves VPCs of a specific type (safe/unsafe) with pagination
func (s *VPCService) ListByVpcType(vpcType string, page, pageSize int) ([]models.VPC, int64, error) {
	var vpcs []models.VPC
	var totalCount int64

	// Get total count for this VPC type
	if err := s.db.Model(&models.VPC{}).Where("vpc_type = ?", vpcType).Count(&totalCount).Error; err != nil {
		return nil, 0, err
	}

	// Calculate offset
	offset := (page - 1) * pageSize

	// Get paginated results
	err := s.db.Where("vpc_type = ?", vpcType).Offset(offset).Limit(pageSize).Find(&vpcs).Error
	return vpcs, totalCount, err
}

func (s *VPCService) HandleCreateVPCMail(vpc *models.VPC) {
	// a copy of the VPC to avoid any potential data races
	vpcCopy := *vpc

	// Get Admin emails
	managerEmails, err := s.getAdminAndSafetyOfficerEmails()
	if err != nil {
		log.Printf("Failed to retrieve Admin & safety Officer emails for Vpc notification: %v", err)
		return
	}

	// Send notification
	if err := s.mailService.sendVPCNotificationEmail(managerEmails, &vpcCopy); err != nil {
		log.Printf("Failed to send urgent Vpc notification: %v", err)
		return
	}
}
