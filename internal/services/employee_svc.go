package services

import (
	"context"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"gorm.io/gorm"
)

type EmployeeService struct {
	db *gorm.DB
}

func NewEmployeeService(db *gorm.DB) *EmployeeService {
	return &EmployeeService{db: db}
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
