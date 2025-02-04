package incident

import (
	"github.com/hopkali04/health-sys/internal/models"
	"gorm.io/gorm"
)

type IncidentService struct {
	db *gorm.DB
}

func NewIncidentService(db *gorm.DB) *IncidentService {
	return &IncidentService{db: db}
}

func (r *IncidentService) CreateIncident(incident *models.Incident) error {
	return r.db.Create(incident).Error
}
