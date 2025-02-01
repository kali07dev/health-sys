package dashboard

import (
	"github.com/hopkali04/health-sys/internal/models"
	"gorm.io/gorm"
)

type Repository interface {
	GetIncidentSummary() (*models.IncidentSummary, error)
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) GetIncidentSummary() (*models.IncidentSummary, error) {
	var summary models.IncidentSummary
	// Add logic to calculate summary
	return &summary, nil
}
