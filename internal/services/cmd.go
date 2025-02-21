package services

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/schema"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AdminService struct {
	db *gorm.DB
}

func NewAdminService(db *gorm.DB) *AdminService {
	return &AdminService{
		db: db,
	}
}

func (svc *AdminService) CreateAdminWithEmployee(request *schema.CreateUserWithEmployeeRequest) error {
	// Start a database transaction
	tx := svc.db.Begin()
	if tx.Error != nil {
		return errors.New("failed to start transaction")
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)
	if err != nil {
		tx.Rollback()
		return errors.New("failed to hash password")
	}

	// Create the User record
	user := models.User{
		ID:           uuid.New(),
		Email:        request.Email,
		PasswordHash: string(hashedPassword),
		GoogleID:     &request.GoogleID,
		MicrosoftID:  &request.MicrosoftID,
		IsActive:     true, // Default to active
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	if request.GoogleID == "" {
		user.GoogleID = nil
	}
	if request.MicrosoftID == "" {
		user.MicrosoftID = nil
	}

	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		return errors.New("failed to create user")
	}

	// Create the Employee record
	employee := models.Employee{
		ID:                 uuid.New(),
		UserID:             user.ID, // Link to the created user
		EmployeeNumber:     request.EmployeeNumber,
		FirstName:          request.FirstName,
		LastName:           request.LastName,
		Department:         request.Department,
		Position:           request.Position,
		Role:               request.Role,
		ReportingManagerID: request.ReportingManagerID,
		StartDate:          request.StartDate,
		EndDate:            request.EndDate,
		// EmergencyContact:   models.JSONB([]byte(request.EmergencyContact)),
		ContactNumber:   request.ContactNumber,
		OfficeLocation:  request.OfficeLocation,
		IsSafetyOfficer: request.IsSafetyOfficer,
		IsActive:        true, // Default to active
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if err := tx.Create(&employee).Error; err != nil {
		tx.Rollback()
		return errors.New(err.Error())
	}

	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return errors.New("failed to commit transaction")
	}

	return nil
}
