package incident

import (
	"github.com/hopkali04/health-sys/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository interface {
	CreateIncident(incident *models.Incident) error
	GetIncidentByID(id uuid.UUID) (*models.Incident, error)
	UpdateIncident(incident *models.Incident) error
	DeleteIncident(id uuid.UUID) error
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) CreateIncident(incident *models.Incident) error {
	return r.db.Create(incident).Error
}

func (r *repository) GetIncidentByID(id uuid.UUID) (*models.Incident, error) {
	var incident models.Incident
	if err := r.db.First(&incident, id).Error; err != nil {
		return nil, err
	}
	return &incident, nil
}

func (r *repository) UpdateIncident(incident *models.Incident) error {
	return r.db.Save(incident).Error
}

func (r *repository) DeleteIncident(id uuid.UUID) error {
	return r.db.Delete(&models.Incident{}, id).Error
}
