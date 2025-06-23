package services

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/schema"
)

func (s *TemporaryEmployeeService) SearchTemporaryEmployeesByQuery(ctx context.Context, query string) ([]models.TemporaryEmployee, error) {
	var employees []models.TemporaryEmployee
	// Prepare the query string for case-insensitive LIKE comparison
	lowerQuery := "%" + strings.ToLower(query) + "%"

	if err := s.db.WithContext(ctx).
		Where("LOWER(first_name) LIKE ?", lowerQuery).
		Or("LOWER(last_name) LIKE ?", lowerQuery).
		Or("LOWER(department) LIKE ?", lowerQuery).
		Or("LOWER(position) LIKE ?", lowerQuery).
		Find(&employees).Error; err != nil {
		return nil, fmt.Errorf("database error searching temporary employees: %w", err)
	}
	return employees, nil
}
func (s *TemporaryEmployeeService) SearchPermanentEmployees(ctx context.Context, query string) ([]models.Employee, error) {
	var employees []models.Employee
	// Prepare the query string for case-insensitive LIKE comparison
	lowerQuery := "%" + strings.ToLower(query) + "%"

	if err := s.db.WithContext(ctx).
		Where("LOWER(first_name) LIKE ?", lowerQuery).
		Or("LOWER(last_name) LIKE ?", lowerQuery).
		Or("LOWER(department) LIKE ?", lowerQuery).
		Or("LOWER(position) LIKE ?", lowerQuery).
		Find(&employees).Error; err != nil {
		return nil, fmt.Errorf("database error searching regular employees: %w", err)
	}

	return employees, nil
}

func (s *TemporaryEmployeeService) SearchAllEmployees(ctx context.Context, query string) ([]schema.CombinedEmployeeSearchResult, error) {
	var combinedResults []schema.CombinedEmployeeSearchResult

	// --- 1. Search Regular Employees ---
	// Reuse the existing SearchEmployees method for regular employees.
	regularEmployees, err := s.SearchPermanentEmployees(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to search regular employees: %w", err)
	}

	// Convert each regular employee to the unified CombinedEmployeeSearchResult format.
	for _, emp := range regularEmployees {
		combinedResults = append(combinedResults, schema.CombinedEmployeeSearchResult{
			ID:             emp.ID.String(), // Convert UUID to string
			Type:           "Regular",
			FirstName:      emp.FirstName,
			LastName:       emp.LastName,
			Department:     emp.Department,
			Position:       emp.Position,
			ContactNumber:  emp.ContactNumber,
			OfficeLocation: emp.OfficeLocation,
			IsActive:       emp.IsActive,
		})
	}


	// Use the new SearchTemporaryEmployeesByQuery method for temporary employees.
	temporaryEmployees, err := s.SearchTemporaryEmployeesByQuery(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to search temporary employees: %w", err)
	}

	// Convert each temporary employee to the unified CombinedEmployeeSearchResult format.
	for _, tempEmp := range temporaryEmployees {
		combinedResults = append(combinedResults, schema.CombinedEmployeeSearchResult{
			ID:             strconv.Itoa(tempEmp.ID), // Convert int ID to string for consistency
			Type:           "Temporary",
			FirstName:      tempEmp.FirstName,
			LastName:       tempEmp.LastName,
			Department:     tempEmp.Department,
			Position:       tempEmp.Position,
			ContactNumber:  tempEmp.ContactNumber,
			OfficeLocation: tempEmp.OfficeLocation,
			IsActive:       tempEmp.IsActive,
		})
	}
	if len(combinedResults) == 0 {
		return []schema.CombinedEmployeeSearchResult{}, nil
	}

	return combinedResults, nil
}