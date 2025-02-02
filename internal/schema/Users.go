package schema

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// ustom type for JSON data
type JSONB json.RawMessage

type UserRequest struct {
	Email           string `json:"email" validate:"required,email"`
	Password        string `json:"password" validate:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" validate:"required,min=8"`
	GoogleID        string `json:"google_id,omitempty"`
	MicrosoftID     string `json:"microsoft_id,omitempty"`
}

type UserLoginRequest struct {
	Email       string `json:"email" validate:"required,email"`
	Password    string `json:"password" validate:"required,min=8"`
	GoogleID    string `json:"google_id,omitempty"`
	MicrosoftID string `json:"microsoft_id,omitempty"`
}

type UserResponse struct {
	ID                string    `json:"id"`
	Email             string    `json:"email"`
	MFAEnabled        bool      `json:"mfa_enabled"`
	IsActive          bool      `json:"is_active"`
	LastLoginAt       time.Time `json:"last_login_at"`
	PasswordChangedAt time.Time `json:"password_changed_at"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type ChangePasswordReq struct {
	Email           string `json:"email" validate:"required,email"`
	Password        string `json:"password" validate:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" validate:"required,min=8"`
}

type CreateUserWithEmployeeRequest struct {
	// User fields
	Email           string `json:"email" validate:"required,email"`
	Password        string `json:"password" validate:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" validate:"required,min=8"`
	GoogleID        string `json:"google_id,omitempty"`
	MicrosoftID     string `json:"microsoft_id,omitempty"`

	// Employee fields
	EmployeeNumber     string    `json:"employee_number" validate:"required"`
	FirstName          string    `json:"first_name" validate:"required"`
	LastName           string    `json:"last_name" validate:"required"`
	Department         string    `json:"department" validate:"required"`
	Position           string    `json:"position" validate:"required"`
	Role               string    `json:"role" validate:"required,oneof=admin safety_officer manager employee"`
	ReportingManagerID uuid.UUID `json:"reporting_manager_id"`
	StartDate          time.Time `json:"start_date" validate:"required"`
	EndDate            time.Time `json:"end_date"`
	EmergencyContact   string    `json:"emergency_contact"` // JSONB is a custom type for JSON data
	ContactNumber      string    `json:"contact_number" validate:"required"`
	OfficeLocation     string    `json:"office_location" validate:"required"`
	IsSafetyOfficer    bool      `json:"is_safety_officer"`
}
