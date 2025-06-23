package services

import (
	"errors"

	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/schema"

	"gorm.io/gorm"
)

type TemporaryEmployeeService struct {
	db *gorm.DB
}

func NewTemporaryEmployeeService(db *gorm.DB) *TemporaryEmployeeService {
	return &TemporaryEmployeeService{db: db}
}

func (s *TemporaryEmployeeService) Create(employee *models.TemporaryEmployee) error {
	return s.db.Create(employee).Error
}

func (s *TemporaryEmployeeService) GetByID(id int) (*models.TemporaryEmployee, error) {
	var employee models.TemporaryEmployee
	if err := s.db.First(&employee, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("employee not found")
		}
		return nil, err
	}
	return &employee, nil
}

func (s *TemporaryEmployeeService) Update(id int, updateData *schema.UpdateTemporaryEmployeeRequest) (*models.TemporaryEmployee, error) {
	var employee models.TemporaryEmployee
	if err := s.db.First(&employee, id).Error; err != nil {
		return nil, err
	}

	if updateData.FirstName != "" {
		employee.FirstName = updateData.FirstName
	}
	if updateData.LastName != "" {
		employee.LastName = updateData.LastName
	}
	if updateData.Department != "" {
		employee.Department = updateData.Department
	}
	if updateData.Position != "" {
		employee.Position = updateData.Position
	}
	if updateData.ContactNumber != "" {
		employee.ContactNumber = updateData.ContactNumber
	}
	if updateData.OfficeLocation != "" {
		employee.OfficeLocation = updateData.OfficeLocation
	}
	if updateData.IsActive != nil {
		employee.IsActive = *updateData.IsActive
	}

	if err := s.db.Save(&employee).Error; err != nil {
		return nil, err
	}
	return &employee, nil
}

func (s *TemporaryEmployeeService) Delete(id int) error {
	return s.db.Delete(&models.TemporaryEmployee{}, id).Error
}
func (s *TemporaryEmployeeService) StatusChange(id int, action string) error {
	var employee models.TemporaryEmployee
	if err := s.db.First(&employee, id).Error; err != nil {
		return err
	}
	if action == "deactivate" {
		employee.IsActive = false
	} else if action == "activate" {
		employee.IsActive = true
	}

	if err := s.db.Save(&employee).Error; err != nil {
		return err
	}
	return nil
}

func (s *TemporaryEmployeeService) GetAll() ([]models.TemporaryEmployee, error) {
	var employees []models.TemporaryEmployee
	if err := s.db.Find(&employees).Error; err != nil {
		return nil, err
	}
	return employees, nil
}
func (s *TemporaryEmployeeService) Search(criteria schema.SearchCriteria) ([]models.TemporaryEmployee, error) {
	var employees []models.TemporaryEmployee
	query := s.db.Model(&models.TemporaryEmployee{})

	if criteria.FirstName != "" {
		query = query.Where("first_name LIKE ?", "%"+criteria.FirstName+"%")
	}
	if criteria.LastName != "" {
		query = query.Where("last_name LIKE ?", "%"+criteria.LastName+"%")
	}
	if criteria.Department != "" {
		query = query.Where("department = ?", criteria.Department)
	}
	if criteria.Position != "" {
		query = query.Where("position = ?", criteria.Position)
	}
	if criteria.OfficeLocation != "" {
		query = query.Where("office_location = ?", criteria.OfficeLocation)
	}
	if criteria.IsActive != nil {
		query = query.Where("is_active = ?", *criteria.IsActive)
	}

	if err := query.Find(&employees).Error; err != nil {
		return nil, err
	}
	return employees, nil
}
