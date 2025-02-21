package services

import (
	"errors"
	"time"

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

func (s *NotificationSettingsService) GetByUserID(userID uuid.UUID) (*models.NotificationSettings, error) {
	var settings models.NotificationSettings
	if err := s.db.Where("user_id = ?", userID).First(&settings).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create default settings if none exist
			settings = models.NotificationSettings{
				UserID:            userID,
				ReminderFrequency: "daily",
			}
			if err := s.db.Create(&settings).Error; err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}
	return &settings, nil
}

func (s *NotificationSettingsService) Update(userID uuid.UUID, frequency string) (*models.NotificationSettings, error) {
	validFrequencies := map[string]bool{
		"immediate": true,
		"hourly":    true,
		"daily":     true,
		"weekly":    true,
	}

	if !validFrequencies[frequency] {
		return nil, errors.New("invalid reminder frequency")
	}

	var settings models.NotificationSettings
	result := s.db.Where("user_id = ?", userID).First(&settings)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			settings = models.NotificationSettings{
				UserID:            userID,
				ReminderFrequency: frequency,
			}
			if err := s.db.Create(&settings).Error; err != nil {
				return nil, err
			}
		} else {
			return nil, result.Error
		}
	} else {
		settings.ReminderFrequency = frequency
		settings.UpdatedAt = time.Now()
		if err := s.db.Save(&settings).Error; err != nil {
			return nil, err
		}
	}

	return &settings, nil
}
