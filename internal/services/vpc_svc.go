package services

import (
	"errors"
	"fmt"
	"log"

	"github.com/hopkali04/health-sys/internal/models"
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
func (s *VPCService) getAdminAndSafetyOfficerEmails() ([]string, error) {
	var employees []models.Employee
	err := s.db.Where("(role = ? OR role = ?) AND is_active = ?", "admin", "safety_officer", true).
		Joins("Users").
		Select("Users.email").
		Find(&employees).Error

	if err != nil {
		return nil, fmt.Errorf("failed to query admins and safety officers: %v", err)
	}

	emails := make([]string, 0, len(employees))
	for _, emp := range employees {
		if emp.User.Email != "" {
			emails = append(emails, emp.User.Email)
		}
	}

	return emails, nil
}

// Create creates a new VPC record
func (s *VPCService) Create(vpc *models.VPC) error {
	return s.db.Create(vpc).Error
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

	// Get Admin emails
	managerEmails, err := s.getAdminAndSafetyOfficerEmails()
	if err != nil {
		log.Printf("Failed to retrieve Admin & safety Officer emails for Vpc notification: %v", err)
		return
	}

	// Send notification
	if err := s.mailService.sendVPCNotificationEmail(managerEmails, vpc); err != nil {
		log.Printf("Failed to send urgent Vpc notification: %v", err)
		return
	}
}
