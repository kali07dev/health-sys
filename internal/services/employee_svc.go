package services

import (
	"context"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/schema"
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
