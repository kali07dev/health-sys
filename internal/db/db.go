package db

import (
	"fmt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"github.com/hopkali04/health-sys/internal/config"
	"github.com/hopkali04/health-sys/internal/models"
)

func EnableUUIDExtension(db *gorm.DB) error {
	err := db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"").Error
	if err != nil {
		return fmt.Errorf("failed to enable UUID extension: %w", err)
	}
	return nil
}


func ConnectDB(cfg *config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Database.Host, cfg.Database.Port, cfg.Database.User, cfg.Database.Password, cfg.Database.DBName, cfg.Database.SSLMode,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	return db, nil
}

func AutoMigrate(db *gorm.DB) error {
	// List all models here
	err := db.AutoMigrate(
		&models.AuditLog{},
		&models.User{},
		&models.Department{},
		&models.Employee{},
		&models.UserSession{},
		&models.Incident{},
		&models.IncidentAttachment{},
		&models.Investigation{},
		&models.CorrectiveAction{},
		&models.ActionUpdate{},
		&models.Notification{},
		&models.InvestigationInterview{},
		&models.InvestigationEvidence{},
		&models.ActionEvidence{},
	)
	if err != nil {
		return fmt.Errorf("failed to auto-migrate database: %w", err)
	}

	return nil
}