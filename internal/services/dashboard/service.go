package dashboard

import (
	"github.com/hopkali04/health-sys/internal/models"
)

type Service interface {
	GetIncidentSummary() (*models.IncidentSummary, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetIncidentSummary() (*models.IncidentSummary, error) {
	return s.repo.GetIncidentSummary()
}
