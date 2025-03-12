package user

import (
	"fmt"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/schema"
)

// UpdateUserRole updates an employee's role by their UserID
func (s *UserService) UpdateUserRole(userID uuid.UUID, role string) error {
	// Validate role
	validRoles := []string{"admin", "safety_officer", "manager", "employee"}
	isValidRole := false
	for _, validRole := range validRoles {
		if role == validRole {
			isValidRole = true
			break
		}
	}

	if !isValidRole {
		return fmt.Errorf("invalid role: %s", role)
	}

	// Update the employee's role
	result := s.db.Model(&models.Employee{}).
		Where("user_id = ?", userID).
		Update("role", role)

	if result.Error != nil {
		return fmt.Errorf("database error: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("employee not found for user ID: %s", userID)
	}

	return nil
}

// UpdateUser updates user and employee information
func (s *UserService) UpdateUser(userID uuid.UUID, userData schema.UserUpdateData) error {
	// Start a transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update user email
	if userData.Email != "" {
		if err := tx.Model(&models.User{}).
			Where("id = ?", userID).
			Update("email", userData.Email).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to update user email: %w", err)
		}
	}

	// Update employee information
	employeeUpdates := map[string]interface{}{}
	if userData.FirstName != "" {
		employeeUpdates["first_name"] = userData.FirstName
	}
	if userData.LastName != "" {
		employeeUpdates["last_name"] = userData.LastName
	}
	if userData.Department != "" {
		employeeUpdates["department"] = userData.Department
	}
	if userData.Position != "" {
		employeeUpdates["position"] = userData.Position
	}
	if userData.ContactNumber != "" {
		employeeUpdates["contact_number"] = userData.ContactNumber
	}

	if len(employeeUpdates) > 0 {
		result := tx.Model(&models.Employee{}).
			Where("user_id = ?", userID).
			Updates(employeeUpdates)

		if result.Error != nil {
			tx.Rollback()
			return fmt.Errorf("failed to update employee information: %w", result.Error)
		}

		if result.RowsAffected == 0 {
			tx.Rollback()
			return fmt.Errorf("employee not found for user ID: %s", userID)
		}
	}

	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// UpdateUserStatus updates a user's active status
func (s *UserService) UpdateUserStatus(userID uuid.UUID, isActive bool) error {
	// Start a transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update user status
	if err := tx.Model(&models.User{}).
		Where("id = ?", userID).
		Update("is_active", isActive).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to update user status: %w", err)
	}

	// Update employee status to match
	if err := tx.Model(&models.Employee{}).
		Where("user_id = ?", userID).
		Update("is_active", isActive).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to update employee status: %w", err)
	}

	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}
