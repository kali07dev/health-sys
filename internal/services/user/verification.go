package user

import (
	"errors"
	"fmt"
	"html/template"
	"time"

	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/services"
	"github.com/hopkali04/health-sys/internal/services/token"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type VerificationService struct {
	db           *gorm.DB
	emailService *services.EmailService
	tokenService *token.TokenService
}

func NewVerificationService(db *gorm.DB, es *services.EmailService, ts *token.TokenService) *VerificationService {
	return &VerificationService{
		db:           db,
		emailService: es,
		tokenService: ts,
	}
}

func (s *VerificationService) SendVerificationEmail(user *models.User) error {
	// Generate verification token
	token, err := s.tokenService.GenerateToken()
	if err != nil {
		return err
	}

	// Set expiration time
	expiresAt := s.tokenService.GetExpirationTime()

	// Update user with verification token
	user.VerificationToken = token
	user.VerificationExpires = &expiresAt
	if err := s.db.Save(user).Error; err != nil {
		return err
	}

	// Send verification email
	verificationLink := fmt.Sprintf("https://yourdomain.com/verify?token=%s", token)
	return s.emailService.SendEmail(
		[]string{user.Email},
		"Verify Your Account",
		template.HTML(fmt.Sprintf("Please verify your account by clicking this link: %s", verificationLink)),
	)
}

func (s *VerificationService) VerifyAccount(token string) error {
	var user models.User
	if err := s.db.Where("verification_token = ?", token).First(&user).Error; err != nil {
		return errors.New("invalid verification token")
	}

	if user.VerificationExpires.Before(time.Now()) {
		return errors.New("verification token expired")
	}

	user.IsVerified = true
	user.VerificationToken = ""
	user.VerificationExpires = nil

	return s.db.Save(&user).Error
}

// Add password reset functionality
func (s *VerificationService) InitiatePasswordReset(email string) error {
	var user models.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		return errors.New("user not found")
	}

	// Generate reset token
	token, err := s.tokenService.GenerateToken()
	if err != nil {
		return err
	}

	// Set expiration time
	expiresAt := s.tokenService.GetExpirationTime()

	// Update user with reset token
	user.ResetToken = token
	user.ResetTokenExpires = &expiresAt
	if err := s.db.Save(&user).Error; err != nil {
		return err
	}

	// Send reset email
	resetLink := fmt.Sprintf("https://yourdomain.com/reset-password?token=%s", token)
	return s.emailService.SendEmail(
		[]string{user.Email},
		"Reset Your Password",
		template.HTML(fmt.Sprintf("Click this link to reset your password: %s", resetLink)),
	)
}

func (s *VerificationService) CompletePasswordReset(token, newPassword string) error {
	var user models.User
	if err := s.db.Where("reset_token = ?", token).First(&user).Error; err != nil {
		return errors.New("invalid reset token")
	}

	if user.ResetTokenExpires.Before(time.Now()) {
		return errors.New("reset token expired")
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.PasswordHash = string(hashedPassword)
	user.ResetToken = ""
	user.ResetTokenExpires = nil
	user.IsVerified = true
	user.PasswordChangedAt = time.Now()

	return s.db.Save(&user).Error
}
