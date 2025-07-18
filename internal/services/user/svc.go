package user

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/schema"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserService struct {
	db                  *gorm.DB
	VerificationService *VerificationService
}

func NewUserService(db *gorm.DB, vc *VerificationService) *UserService {
	return &UserService{
		db:                  db,
		VerificationService: vc,
	}
}

// GetUserRole retrieves the role of an employee by their UserID and returns it as a string
func (s *UserService) GetUserRole(userID uuid.UUID) (string, error) {
	var employee models.Employee

	err := s.db.
		Select("role").
		Where("user_id = ?", userID).
		First(&employee).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// If no employee is found with the given UserID, return an error
			return "", fmt.Errorf("employee not found for user ID: %s", userID)
		}
		// Return any other database error
		return "", fmt.Errorf("database error: %w", err)
	}

	return employee.Role, nil
}
func (svc *UserService) GetallUsers() ([]models.User, error) {
	var Users []models.User
	err := svc.db.Find(&Users).Error
	if err != nil {
		return nil, err
	}
	return Users, nil
}

func (svc *UserService) CreateUser(user *schema.UserRequest) error {

	// Hash the password using bcrypt
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("failed to hash password")
	}

	// Create the User model to be saved in the database
	UserDatabase := models.User{
		Email:        user.Email,
		PasswordHash: string(hashedPassword), // Store the hashed password
		GoogleID:     &user.GoogleID,
		MicrosoftID:  &user.MicrosoftID,
	}
	if user.GoogleID == "" {
		UserDatabase.GoogleID = nil
	}
	if user.MicrosoftID == "" {
		UserDatabase.MicrosoftID = nil
	}

	// Save the user to the database
	if err := svc.db.Create(&UserDatabase).Error; err != nil {
		return errors.New("failed to create user in the database")
	}

	return nil
}

// CreateUserWithEmployee creates a user and an employee record in a single transaction
func (svc *UserService) CreateUserWithEmployee(request *schema.CreateUserWithEmployeeRequest) error {
	// Start a database transaction
	tx := svc.db.Begin()
	if tx.Error != nil {
		return errors.New("failed to start transaction")
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)
	if err != nil {
		tx.Rollback()
		return errors.New("failed to hash password")
	}

	// Create the User record
	user := models.User{
		ID:           uuid.New(),
		Email:        request.Email,
		PasswordHash: string(hashedPassword),
		GoogleID:     &request.GoogleID,
		MicrosoftID:  &request.MicrosoftID,
		IsActive:     true, // Default to active
		IsVerified: true, // Default to verified, TODO: change after Email Server issues are fixed
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	if request.GoogleID == "" {
		user.GoogleID = nil
	}
	if request.MicrosoftID == "" {
		user.MicrosoftID = nil
	}

	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		return errors.New("failed to create user")
	}

	// Create the Employee record
	employee := models.Employee{
		ID:                 uuid.New(),
		UserID:             user.ID, // Link to the created user
		EmployeeNumber:     fmt.Sprintf("EMP%s", uuid.New().String()[:8]),
		FirstName:          request.FirstName,
		LastName:           request.LastName,
		Department:         request.Department,
		Position:           request.Position,
		Role:               request.Role,
		ReportingManagerID: request.ReportingManagerID,
		StartDate:          request.StartDate,
		EndDate:            request.EndDate,
		// EmergencyContact:   models.JSONB([]byte(request.EmergencyContact)),
		ContactNumber:   request.ContactNumber,
		OfficeLocation:  request.OfficeLocation,
		IsSafetyOfficer: request.IsSafetyOfficer,
		IsActive:        true, // Default to active
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if err := tx.Create(&employee).Error; err != nil {
		tx.Rollback()
		return errors.New(err.Error())
	}

	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return errors.New("failed to commit transaction")
	}

	return nil
}

// Login verifies the user's credentials and returns the user if successful
func (svc *UserService) Login(credentials *schema.UserLoginRequest) (*models.User, error) {
	// Fetch the user from the database using the email
	var user models.User
	if credentials.UserID != "" {
		err := svc.db.Where("id = ?", credentials.UserID).First(&user).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("user not found")
			}
			return nil, errors.New("failed to fetch user from the database")
		}
	}else if credentials.Email != ""  {
		err := svc.db.Where("email = ?", credentials.Email).First(&user).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("user not found")
			}
			return nil, errors.New("failed to fetch user from the database")
		}
	}

	// Check if the account is locked
	if user.AccountLocked {
		return nil, errors.New("account is locked")
	}

	// Check if the account is inactive
	if !user.IsActive {
		return nil, errors.New("account is inactive")
	}

	// Compare the provided password with the hashed password in the database
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(credentials.Password)); err != nil {
		// Increment failed login attempts
		user.FailedLoginAttempts++
		if user.FailedLoginAttempts >= 5 { // Lock the account after 5 failed attempts
			user.AccountLocked = true
		}
		svc.db.Save(&user) // Save the updated user record
		return nil, errors.New("incorrect password")
	}

	// Reset failed login attempts on successful login
	user.FailedLoginAttempts = 0
	user.LastLoginAt = time.Now() // Update the last login timestamp
	svc.db.Save(&user)            // Save the updated user record

	// map Response for abstraction

	return &user, nil
}
func (svc *UserService) GetUserByID(id uuid.UUID) (*models.User, error) {
	var user models.User
	if err := svc.db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (svc *UserService) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	if err := svc.db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}
func (svc *UserService) GetUserByPhone(phoneNumber string) (*models.User, error) {
	var emp models.Employee
	var user models.User
	if err := svc.db.Where("contact_number = ?", phoneNumber).First(&emp).Error; err != nil {
		return nil, err
	}
	if err := svc.db.Where("id = ?", emp.UserID).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (svc *UserService) UpdateUserEmail(id string, email string) error {
	err := svc.db.Where("id = ?", id).UpdateColumn("email", email).Error
	if err != nil {
		return err
	}
	return nil
}

// ChangePassword updates the user's password in the database
func (svc *UserService) ChangePassword(userID uuid.UUID, newPassword string) error {
	// Hash the new password using bcrypt
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("failed to hash new password")
	}

	// Update the user's password hash and set the password changed timestamp
	result := svc.db.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"password_hash":       string(hashedPassword),
		"password_changed_at": time.Now(),
	})

	if result.Error != nil {
		return errors.New("failed to update password in the database")
	}

	if result.RowsAffected == 0 {
		return errors.New("user not found")
	}

	return nil
}

func (svc *UserService) DeleteUser(id uuid.UUID) error {
	return svc.db.Delete(&models.User{}, id).Error
}

// CheckEmailExists checks if a user with the given email already exists in the database, returns true if exists
func (svc *UserService) CheckEmailExists(email string) (bool, error) {
	var count int64
	// Query the database to count users with the given email
	if err := svc.db.Model(&models.User{}).Where("email = ?", email).Count(&count).Error; err != nil {
		return false, errors.New("failed to check email existence")
	}

	// If count > 0, the email already exists
	return count > 0, nil
}

func (svc *UserService) BulkCreateUsers(users []schema.UserRequest) error {
	tx := svc.db.Begin()
	if tx.Error != nil {
		return errors.New("failed to start transaction")
	}

	for _, userReq := range users {
		user := models.User{
			Email:     userReq.Email,
			IsActive:  true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		if err := tx.Create(&user).Error; err != nil {
			tx.Rollback()
			return err
		}

		// Send verification email
		if err := svc.VerificationService.SendVerificationEmail(&user); err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit().Error
}
func (svc *UserService) BulkCreateUsersWithEmployees(requests []schema.CreateUserWithEmployeeRequest) error {
	// Start a database transaction
	tx := svc.db.Begin()
	if tx.Error != nil {
		return errors.New("failed to start transaction for bulk creation")
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Process each request in the batch
	for _, request := range requests {
		// Hash the password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)
		if err != nil {
			tx.Rollback()
			return errors.New("failed to hash password for bulk creation")
		}

		// Create the User record
		user := models.User{
			ID:           uuid.New(),
			Email:        request.Email,
			PasswordHash: string(hashedPassword),
			GoogleID:     &request.GoogleID,
			MicrosoftID:  &request.MicrosoftID,
			IsActive:     true,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}
		if request.GoogleID == "" {
			user.GoogleID = nil
		}
		if request.MicrosoftID == "" {
			user.MicrosoftID = nil
		}

		if err := tx.Create(&user).Error; err != nil {
			tx.Rollback()
			return errors.New("failed to create user in bulk creation")
		}

		// Create the Employee record
		employee := models.Employee{
			ID:                 uuid.New(),
			UserID:             user.ID,
			EmployeeNumber:     fmt.Sprintf("EMP%s", uuid.New().String()[:8]),
			FirstName:          request.FirstName,
			LastName:           request.LastName,
			Department:         request.Department,
			Position:           request.Position,
			Role:               request.Role,
			ReportingManagerID: request.ReportingManagerID,
			StartDate:          request.StartDate,
			EndDate:            request.EndDate,
			ContactNumber:      request.ContactNumber,
			OfficeLocation:     request.OfficeLocation,
			IsSafetyOfficer:    request.IsSafetyOfficer,
			IsActive:           true,
			CreatedAt:          time.Now(),
			UpdatedAt:          time.Now(),
		}

		if err := tx.Create(&employee).Error; err != nil {
			tx.Rollback()
			return errors.New("failed to create employee in bulk creation")
		}
	}

	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return errors.New("failed to commit transaction for bulk creation")
	}

	return nil
}
