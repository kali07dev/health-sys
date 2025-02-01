package services

import (
	"context"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"gorm.io/gorm"
)

type NotificationSettingsService struct {
	db *gorm.DB
}

func NewNotificationSettingsService(db *gorm.DB) *NotificationSettingsService {
	return &NotificationSettingsService{db: db}
}

// GetNotificationSettings retrieves notification settings for a user
func (s *NotificationSettingsService) GetNotificationSettings(ctx context.Context, userID uuid.UUID) (*models.NotificationSettings, error) {
	var settings models.NotificationSettings
	err := s.db.WithContext(ctx).First(&settings, "user_id = ?", userID).Error
	return &settings, err
}

// UpdateNotificationSettings updates notification settings for a user
func (s *NotificationSettingsService) UpdateNotificationSettings(ctx context.Context, userID uuid.UUID, frequency string) error {
	return s.db.WithContext(ctx).Model(&models.NotificationSettings{}).Where("user_id = ?", userID).Update("reminder_frequency", frequency).Error
}