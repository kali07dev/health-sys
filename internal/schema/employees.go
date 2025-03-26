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
	ID                 string            `json:"ID"`
	UserID             string            `json:"UserId"`
	EmployeeNumber     string            `json:"EmployeeNumber"`
	FirstName          string            `json:"FirstName"`
	LastName           string            `json:"LastName"`
	Department         string            `json:"Department"`
	Position           string            `json:"Position"`
	Role               string            `json:"Role"`
	ReportingManagerID *string           `json:"ReportingManagerId,omitempty"`
	StartDate          string            `json:"startDate"`
	EndDate            *string           `json:"endDate,omitempty"`
	EmergencyContact   map[string]string `json:"EmergencyContact,omitempty"`
	ContactNumber      string            `json:"ContactNumber"`
	OfficeLocation     string            `json:"OfficeLocation"`
	IsSafetyOfficer    bool              `json:"isSafetyOfficer"`
	IsActive           bool              `json:"isActive"`
	CreatedAt          string            `json:"createdAt"`
	UpdatedAt          string            `json:"updatedAt"`
	DeletedAt          *string           `json:"deletedAt,omitempty"`
}
type EmployeeProfileResponse struct {
	ID               string            `json:"ID"`
	FirstName        string            `json:"FirstName"`
	LastName         string            `json:"LastName"`
	Department       string            `json:"Department"`
	Position         string            `json:"Position"`
	Role             string            `json:"Role"`
	EmergencyContact map[string]string `json:"EmergencyContact,omitempty"`
	ContactNumber    string            `json:"ContactNumber"`
	OfficeLocation   string            `json:"OfficeLocation"`

	Email string `json:"Email"`
}
type ProfileUpateRequest struct {
	ID               string            `json:"ID"`
	FirstName        string            `json:"FirstName"`
	LastName         string            `json:"LastName"`
	EmergencyContact map[string]string `json:"EmergencyContact,omitempty"`
	ContactNumber    string            `json:"ContactNumber"`

	Password string `json:"Password"`
	UserID   string
}

func EmployeeToResponse(e *models.Employee) EmployeeResponse {
	// First check if the employee pointer is nil
	if e == nil {
		return EmployeeResponse{}
	}

	// Convert UUID fields to strings
	var reportingManagerID *string
	if e.ReportingManagerID != nil && *e.ReportingManagerID != uuid.Nil {
		str := e.ReportingManagerID.String()
		reportingManagerID = &str
	}

	// Convert EmergencyContact JSONB to a map[string]string
	var emergencyContact map[string]string
	if e.EmergencyContact != nil {
		emergencyContact = make(map[string]string)
		jsonMap := *e.EmergencyContact
		for k, v := range jsonMap {
			if v != nil { // Add nil check for map values
				emergencyContact[k] = fmt.Sprintf("%v", v)
			}
		}
	}

	// Handle nil time fields
	var endDate, deletedAt *string
	if !e.EndDate.IsZero() {
		formatted := e.EndDate.Format(time.RFC3339)
		endDate = &formatted
	}
	if e.DeletedAt != nil && !e.DeletedAt.IsZero() { // Add nil check
		formatted := e.DeletedAt.Format(time.RFC3339)
		deletedAt = &formatted
	}

	// Handle required time fields
	createdAt := time.Now().Format(time.RFC3339)
	if !e.CreatedAt.IsZero() {
		createdAt = e.CreatedAt.Format(time.RFC3339)
	}

	updatedAt := time.Now().Format(time.RFC3339)
	if !e.UpdatedAt.IsZero() {
		updatedAt = e.UpdatedAt.Format(time.RFC3339)
	}

	startDate := time.Now().Format(time.RFC3339)
	if !e.StartDate.IsZero() {
		startDate = e.StartDate.Format(time.RFC3339)
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
		CreatedAt:          createdAt,
		UpdatedAt:          updatedAt,
		DeletedAt:          deletedAt,
	}
}
func EmployeeProfileToResponse(e *models.Employee) EmployeeProfileResponse {
	// First check if the employee pointer is nil
	if e == nil {
		return EmployeeProfileResponse{}
	}

	// Convert EmergencyContact JSONB to a map[string]string
	var emergencyContact map[string]string
	if e.EmergencyContact != nil {
		emergencyContact = make(map[string]string)
		jsonMap := *e.EmergencyContact
		for k, v := range jsonMap {
			if v != nil { // Add nil check for map values
				emergencyContact[k] = fmt.Sprintf("%v", v)
			}
		}
	}

	return EmployeeProfileResponse{
		ID:         e.ID.String(),
		Email:      e.User.Email,
		FirstName:  e.FirstName,
		LastName:   e.LastName,
		Department: e.Department,
		Position:   e.Position,
		Role:       e.Role,

		EmergencyContact: emergencyContact,
		ContactNumber:    e.ContactNumber,
		OfficeLocation:   e.OfficeLocation,
	}
}

// ToResponseArray converts a slice of Employee models to a slice of EmployeeResponse schemas
func EmployeeToResponseArray(employees []models.Employee) []EmployeeResponse {
	if len(employees) == 0 {
		return []EmployeeResponse{}
	}

	response := make([]EmployeeResponse, len(employees))
	for i, employee := range employees {
		emp := employee // Create a copy to avoid pointer issues
		response[i] = EmployeeToResponse(&emp)
	}
	return response
}
