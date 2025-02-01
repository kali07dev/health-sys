package user

import (
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/utils"

	"github.com/google/uuid"
)

type Service interface {
	RegisterUser(user *models.User) error
	LoginUser(email, password string) (*models.User, error)
	GetUserByID(id uuid.UUID) (*models.User, error)
	UpdateUser(user *models.User) error
	DeleteUser(id uuid.UUID) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) RegisterUser(user *models.User) error {
	utils.LogInfo("Creating user", map[string]interface{}{
		"email": user.Email,
		"role":  "default",
	})

	if err := s.repo.CreateUser(user); err != nil {
		utils.LogError("Failed to create user", map[string]interface{}{
			"error": err.Error(),
			"email": user.Email,
		})
		return err
	}

	return nil
}

func (s *service) LoginUser(email, password string) (*models.User, error) {
	user, err := s.repo.GetUserByEmail(email)
	if err != nil {
		return nil, err
	}
	// Add password validation logic here
	return user, nil
}

func (s *service) GetUserByID(id uuid.UUID) (*models.User, error) {
	return s.repo.GetUserByID(id)
}

func (s *service) UpdateUser(user *models.User) error {
	return s.repo.UpdateUser(user)
}

func (s *service) DeleteUser(id uuid.UUID) error {
	return s.repo.DeleteUser(id)
}
