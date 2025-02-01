package schema

import "time"

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
