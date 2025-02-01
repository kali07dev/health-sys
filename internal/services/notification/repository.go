package notification

import (
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"gorm.io/gorm"
)

type Repository interface {
	CreateNotification(notification *models.Notification) error
	GetNotificationsByUserID(userID uuid.UUID) ([]models.Notification, error)
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) CreateNotification(notification *models.Notification) error {
	return r.db.Create(notification).Error
}

func (r *repository) GetNotificationsByUserID(userID uuid.UUID) ([]models.Notification, error) {
	var notifications []models.Notification
	if err := r.db.Where("user_id = ?", userID).Find(&notifications).Error; err != nil {
		return nil, err
	}
	return notifications, nil
}
