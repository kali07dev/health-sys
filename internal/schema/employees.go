package schema

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
)

// JSONB represents a JSONB field in the database
// type JSONB map[string]interface{}

// Scan implements the Scanner interface for JSONB
func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("failed to unmarshal JSONB: %v", value)
	}
	return json.Unmarshal(bytes, j)
}

// Value implements the Valuer interface for JSONB
func (j JSONB) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

type EmployeeResponse struct {
	ID                 string            `json:"id"`
	UserID             string            `json:"userId"`
	EmployeeNumber     string            `json:"employeeNumber"`
	FirstName          string            `json:"firstName"`
	LastName           string            `json:"lastName"`
	Department         string            `json:"department"`
	Position           string            `json:"position"`
	Role               string            `json:"role"`
	ReportingManagerID string            `json:"reportingManagerId,omitempty"`
	StartDate          string            `json:"startDate"`
	EndDate            *string           `json:"endDate,omitempty"`
	EmergencyContact   map[string]string `json:"emergencyContact"`
	ContactNumber      string            `json:"contactNumber"`
	OfficeLocation     string            `json:"officeLocation"`
	IsSafetyOfficer    bool              `json:"isSafetyOfficer"`
	IsActive           bool              `json:"isActive"`
	CreatedAt          string            `json:"createdAt"`
	UpdatedAt          string            `json:"updatedAt"`
	DeletedAt          *string           `json:"deletedAt,omitempty"`
}

// ToResponse converts a single Employee model to an EmployeeResponse schema
func EmployeeToResponse(e *models.Employee) EmployeeResponse {
	// Convert time fields to ISO 8601 formatted strings
	startDate := e.StartDate.Format(time.RFC3339)
	var endDate, deletedAt *string
	if !e.EndDate.IsZero() {
		endDateStr := e.EndDate.Format(time.RFC3339)
		endDate = &endDateStr
	}
	if !e.DeletedAt.IsZero() {
		deletedAtStr := e.DeletedAt.Format(time.RFC3339)
		deletedAt = &deletedAtStr
	}

	// Convert UUID fields to strings
	reportingManagerID := ""
	if e.ReportingManagerID != uuid.Nil {
		reportingManagerID = e.ReportingManagerID.String()
	}

	// Convert EmergencyContact JSONB to a map[string]string
	var emergencyContact map[string]string
	if e.EmergencyContact != nil {
		// Create a new map and convert all values to strings
		emergencyContact = make(map[string]string)
		for k, v := range e.EmergencyContact {
			emergencyContact[k] = fmt.Sprintf("%v", v)
		}
	}

	return EmployeeResponse{
		ID:                 e.ID.String(),
		UserID:             e.UserID.String(),
		EmployeeNumber:     e.EmployeeNumber,
		FirstName:          e.FirstName,
		LastName:           e.LastName,
		Department:         e.Department,
		Position:           e.Position,
		Role:               e.Role,
		ReportingManagerID: reportingManagerID,
		StartDate:          startDate,
		EndDate:            endDate,
		EmergencyContact:   emergencyContact,
		ContactNumber:      e.ContactNumber,
		OfficeLocation:     e.OfficeLocation,
		IsSafetyOfficer:    e.IsSafetyOfficer,
		IsActive:           e.IsActive,
		CreatedAt:          e.CreatedAt.Format(time.RFC3339),
		UpdatedAt:          e.UpdatedAt.Format(time.RFC3339),
		DeletedAt:          deletedAt,
	}
}

// ToResponseArray converts a slice of Employee models to a slice of EmployeeResponse schemas
func EmployeeToResponseArray(employees []models.Employee) []EmployeeResponse {
	response := make([]EmployeeResponse, len(employees))
	for i, employee := range employees {
		response[i] = EmployeeToResponse(&employee)
	}
	return response
}
