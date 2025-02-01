package notification

import (
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
)

type Service interface {
	CreateNotification(notification *models.Notification) error
	GetNotificationsByUserID(userID uuid.UUID) ([]models.Notification, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) CreateNotification(notification *models.Notification) error {
	return s.repo.CreateNotification(notification)
}

func (s *service) GetNotificationsByUserID(userID uuid.UUID) ([]models.Notification, error) {
	return s.repo.GetNotificationsByUserID(userID)
}
