package incident

import (
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
)

type Service interface {
	CreateIncident(incident *models.Incident) error
	GetIncidentByID(id uuid.UUID) (*models.Incident, error)
	UpdateIncident(incident *models.Incident) error
	DeleteIncident(id uuid.UUID) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) CreateIncident(incident *models.Incident) error {
	return s.repo.CreateIncident(incident)
}

func (s *service) GetIncidentByID(id uuid.UUID) (*models.Incident, error) {
	return s.repo.GetIncidentByID(id)
}

func (s *service) UpdateIncident(incident *models.Incident) error {
	return s.repo.UpdateIncident(incident)
}

func (s *service) DeleteIncident(id uuid.UUID) error {
	return s.repo.DeleteIncident(id)
}
