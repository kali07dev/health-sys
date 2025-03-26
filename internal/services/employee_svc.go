package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/schema"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type EmployeeService struct {
	db          *gorm.DB
	mailService *EmailService
}

func NewEmployeeService(db *gorm.DB, emailSvc *EmailService) *EmployeeService {
	return &EmployeeService{
		db:          db,
		mailService: emailSvc,
	}
}

func (s *EmployeeService) SearchEmployees(ctx context.Context, query string) ([]models.Employee, error) {
	var employees []models.Employee

	// Perform a case-insensitive search on first name, last name, department, or position
	if err := s.db.WithContext(ctx).
		Where("LOWER(first_name) LIKE ?", "%"+query+"%").
		Or("LOWER(last_name) LIKE ?", "%"+query+"%").
		Or("LOWER(department) LIKE ?", "%"+query+"%").
		Or("LOWER(position) LIKE ?", "%"+query+"%").
		Find(&employees).Error; err != nil {
		return nil, fmt.Errorf("database error: %w", err)
	}

	return employees, nil
}

// CreateEmployee creates a new employee
func (s *EmployeeService) CreateEmployee(ctx context.Context, employee *models.Employee) error {
	log.Printf("Creating employee: %v", employee)
	return s.db.WithContext(ctx).Create(employee).Error
}
func (r *EmployeeService) GetEmployeeByUserID(userID uuid.UUID) (*models.Employee, error) {
	var employee models.Employee

	// Query the database for the employee with the given UserID
	result := r.db.Where("user_id = ?", userID).First(&employee)
	if result.Error != nil {
		return nil, result.Error
	}

	// Return the retrieved employee
	return &employee, nil
}

// UpdateUserProfile updates user profile and employee profile and changes password if needed
func (r *EmployeeService) UpdateUserProfile(ctx context.Context, req schema.ProfileUpateRequest) error {
    // Start a transaction
    tx := r.db.WithContext(ctx).Begin()
    defer func() {
        if r := recover(); r != nil {
            tx.Rollback()
        }
    }()

    // Find the user
    var user models.User
    if err := tx.Where("id = ?", req.UserID).First(&user).Error; err != nil {
        tx.Rollback()
        return fmt.Errorf("user not found: %v", err)
    }

    // Find the employee
    var employee models.Employee
    if err := tx.Where("user_id = ?", req.UserID).First(&employee).Error; err != nil {
        tx.Rollback()
        return fmt.Errorf("employee not found: %v", err)
    }

    // Update password if provided
    if req.Password != "" {
        hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
        if err != nil {
            tx.Rollback()
            return fmt.Errorf("failed to hash password: %v", err)
        }
        user.PasswordHash = string(hashedPassword)
        user.PasswordChangedAt = time.Now()
    }

    // Update employee fields
    employee.FirstName = req.FirstName
    employee.LastName = req.LastName
    employee.ContactNumber = req.ContactNumber

    // Update emergency contact if provided
    if req.EmergencyContact != nil {
        emergencyContact := models.JSONB{
			"details": req.EmergencyContact,
		}
        employee.EmergencyContact = &emergencyContact
    }

    // Save the employee
    if err := tx.Save(&employee).Error; err != nil {
        tx.Rollback()
        return fmt.Errorf("failed to update employee: %v", err)
    }

    // Save the user
    if err := tx.Save(&user).Error; err != nil {
        tx.Rollback()
        return fmt.Errorf("failed to update user: %v", err)
    }

    // Commit the transaction
    if err := tx.Commit().Error; err != nil {
        return fmt.Errorf("failed to commit transaction: %v", err)
    }

    return nil
}
// GetEmployeeByID retrieves an employee by their ID
func (s *EmployeeService) GetEmployeeByID(ctx context.Context, id uuid.UUID) (*models.Employee, error) {
	var employee models.Employee
	log.Printf("Fetching employee with ID: %s", id)
	err := s.db.WithContext(ctx).Preload("User").Preload("ReportingManager").First(&employee, "id = ?", id).Error
	return &employee, err
}

// UpdateEmployee updates an existing employee
func (s *EmployeeService) UpdateEmployee(ctx context.Context, employee *models.Employee) error {
	log.Printf("Updating employee with ID: %s", employee.ID)
	return s.db.WithContext(ctx).Save(employee).Error
}

// DeleteEmployee deletes an employee by their ID
func (s *EmployeeService) DeleteEmployee(ctx context.Context, id uuid.UUID) error {
	log.Printf("Deleting employee with ID: %s", id)
	return s.db.WithContext(ctx).Delete(&models.Employee{}, "id = ?", id).Error
}

// ListEmployees retrieves all employees
func (s *EmployeeService) ListEmployees(ctx context.Context) ([]models.Employee, error) {
	var employees []models.Employee
	log.Printf("Listing all employees")
	err := s.db.WithContext(ctx).Preload("User").Preload("ReportingManager").Find(&employees).Error
	return employees, err
}

// getManagerEmails retrieves all active manager email addresses
func (s *EmployeeService) getManagerEmails() ([]string, error) {
	var employees []models.Employee
	err := s.db.Where("role = ? AND is_active = ?", "manager", true).
		Joins("Users").
		Select("Users.email").
		Find(&employees).Error

	if err != nil {
		return nil, fmt.Errorf("failed to query managers: %v", err)
	}

	emails := make([]string, 0, len(employees))
	for _, emp := range employees {
		if emp.User.Email != "" {
			emails = append(emails, emp.User.Email)
		}
	}

	return emails, nil
}

// HandleSevereIncidentNotification manages the process of notifying managers for severe incidents
func (s *EmployeeService) HandleSevereIncidentNotification(incident *schema.CreateIncidentRequest) {
	// Check if incident is severe
	if !s.isIncidentSevere(incident) {
		return
	}

	// Get manager emails
	managerEmails, err := s.getManagerEmails()
	if err != nil {
		log.Printf("Failed to retrieve manager emails for incident notification: %v", err)
		return
	}

	// Send notification
	if err := s.mailService.sendUrgentIncidentEmail(managerEmails, incident); err != nil {
		log.Printf("Failed to send urgent incident notification: %v", err)
		return
	}
}

// isIncidentSevere determines if an incident requires urgent notification
func (s *EmployeeService) isIncidentSevere(incident *schema.CreateIncidentRequest) bool {
	// Check severity level
	if incident.SeverityLevel == "critical" || incident.SeverityLevel == "high" {
		return true
	}

	// Check if it's an injury type incident with high severity
	if incident.Type == "injury" && incident.SeverityLevel != "low" {
		return true
	}

	return false
}
