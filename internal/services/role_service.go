package services

import (
	"context"
	"log"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"gorm.io/gorm"
)

type RoleService struct {
	db *gorm.DB
}

func NewRoleService(db *gorm.DB) *RoleService {
	return &RoleService{db: db}
}

// AssignRole assigns a role to an employee
func (s *RoleService) AssignRole(ctx context.Context, employeeID uuid.UUID, role string) error {
	log.Printf("Assigning role %s to employee with ID: %s", role, employeeID)
	return s.db.WithContext(ctx).Model(&models.Employee{}).Where("id = ?", employeeID).Update("role", role).Error
}
