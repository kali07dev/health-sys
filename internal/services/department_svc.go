package services

import (
	"github.com/hopkali04/health-sys/internal/models"
	"gorm.io/gorm"
)

type DepartmentService struct {
	db *gorm.DB
}

func NewDepartmentService(db *gorm.DB) *DepartmentService {
	return &DepartmentService{db: db}
}

// ListEmployees retrieves all employees
func (s *DepartmentService) ListAll() ([]models.Department, error) {
	var depart []models.Department
	err := s.db.Find(&depart).Error
	return depart, err
}

// Create creates a new department
func (s *DepartmentService) Create(department *models.Department) error {
	return s.db.Create(department).Error
}

// Update updates an existing department
func (s *DepartmentService) Update(department *models.Department) error {
	return s.db.Save(department).Error
}

