package services

import (
	"errors"
	"fmt"
	"sort"
	"time"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"gorm.io/gorm"
)

// First, let's update the IncidentSummary struct to be more comprehensive
type IncidentSummary struct {
	Incident          *models.Incident                `json:"incident"`
	Investigation     *models.Investigation           `json:"investigation"`
	CorrectiveActions []models.CorrectiveAction       `json:"corrective_actions"`
	Interviews        []models.InvestigationInterview `json:"interviews"`
	Evidence          []models.InvestigationEvidence  `json:"evidence"`
	ActionEvidence    []models.ActionEvidence         `json:"action_evidence"`
	Timeline          []TimelineEvent                 `json:"timeline"`
	Statistics        SummaryStatistics               `json:"statistics"`
}

type TimelineEvent struct {
	Date        time.Time `json:"date"`
	EventType   string    `json:"event_type"`
	Description string    `json:"description"`
	UserID      uuid.UUID `json:"user_id"`
	UserName    string    `json:"user_name"`
}

type SummaryStatistics struct {
	TotalDaysOpen         int     `json:"total_days_open"`
	DaysInInvestigation   int     `json:"days_in_investigation"`
	CompletedActionsCount int     `json:"completed_actions_count"`
	TotalActionsCount     int     `json:"total_actions_count"`
	InterviewsCount       int     `json:"interviews_count"`
	EvidenceCount         int     `json:"evidence_count"`
	VerificationRate      float64 `json:"verification_rate"`
}

// Add this method to the IncidentService
func (s *IncidentService) GenerateIncidentSummary(incidentID uuid.UUID) (*IncidentSummary, error) {
	var summary IncidentSummary

	// Start a transaction
	tx := s.db.Begin()
	if tx.Error != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", tx.Error)
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Get incident details
	incident, err := s.GetIncident(incidentID)
	if err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to get incident: %w", err)
	}
	summary.Incident = incident

	// Get investigation details
	var investigation models.Investigation
	if err := tx.Where("incident_id = ?", incidentID).First(&investigation).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			tx.Rollback()
			return nil, fmt.Errorf("failed to get investigation: %w", err)
		}
	} else {
		summary.Investigation = &investigation
	}

	// Get corrective actions
	var actions []models.CorrectiveAction
	if err := tx.Where("incident_id = ?", incidentID).Find(&actions).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to get corrective actions: %w", err)
	}
	summary.CorrectiveActions = actions

	// Get interviews
	if investigation.ID != uuid.Nil {
		var interviews []models.InvestigationInterview
		if err := tx.Where("investigation_id = ?", investigation.ID).Find(&interviews).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to get interviews: %w", err)
		}
		summary.Interviews = interviews
	}

	// Get evidence
	if investigation.ID != uuid.Nil {
		var evidence []models.InvestigationEvidence
		if err := tx.Where("investigation_id = ?", investigation.ID).Find(&evidence).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to get evidence: %w", err)
		}
		summary.Evidence = evidence
	}

	// Get action evidence
	// var actionEvidence []models.ActionEvidence
	for _, action := range actions {
		var evidence []models.ActionEvidence
		if err := tx.Where("corrective_action_id = ?", action.ID).Find(&evidence).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to get action evidence: %w", err)
		}
		summary.ActionEvidence = append(summary.ActionEvidence, evidence...)
	}

	// Generate timeline
	summary.Timeline = s.generateTimeline(incident, &investigation, actions, summary.Interviews)

	// Calculate statistics
	summary.Statistics = s.calculateStatistics(incident, &investigation, actions)

	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return &summary, nil
}

// Helper method to generate timeline
func (s *IncidentService) generateTimeline(
	incident *models.Incident,
	investigation *models.Investigation,
	actions []models.CorrectiveAction,
	interviews []models.InvestigationInterview,
) []TimelineEvent {
	var timeline []TimelineEvent

	// Add incident creation
	timeline = append(timeline, TimelineEvent{
		Date:        incident.CreatedAt,
		EventType:   "incident_created",
		Description: "Incident reported",
		UserID:      incident.ReportedBy,
		UserName:    incident.Reporter.FirstName + incident.Reporter.LastName ,
	})

	// Add investigation events
	if investigation != nil {
		timeline = append(timeline, TimelineEvent{
			Date:        investigation.StartedAt,
			EventType:   "investigation_started",
			Description: "Investigation initiated",
			UserID:      investigation.LeadInvestigatorID,
			UserName:    investigation.LeadInvestigator.FirstName + investigation.LeadInvestigator.LastName ,
		})
	}

	// Add interview events
	for _, interview := range interviews {
		timeline = append(timeline, TimelineEvent{
			Date:        interview.ScheduledFor,
			EventType:   "interview_scheduled",
			Description: fmt.Sprintf("Interview scheduled with %s", interview.Interviewee.FirstName + interview.Interviewee.LastName),
			UserID:      interview.IntervieweeID,
			UserName:    interview.Interviewee.FirstName + interview.Interviewee.LastName,
		})
	}

	// Add corrective action events
	for _, action := range actions {
		timeline = append(timeline, TimelineEvent{
			Date:        action.CreatedAt,
			EventType:   "action_created",
			Description: fmt.Sprintf("Corrective action created: %s", action.Description),
			UserID:      action.AssignedBy,
			UserName:    action.Assigner.FirstName + action.Assigner.LastName,
		})

		if !action.CompletedAt.IsZero() {
			timeline = append(timeline, TimelineEvent{
				Date:        action.CompletedAt,
				EventType:   "action_completed",
				Description: fmt.Sprintf("Corrective action completed: %s", action.Description),
				UserID:      action.AssignedTo,
				UserName:    action.Assignee.FirstName + action.Assignee.LastName ,
			})
		}
	}

	// Sort timeline by date
	sort.Slice(timeline, func(i, j int) bool {
		return timeline[i].Date.Before(timeline[j].Date)
	})

	return timeline
}

// Helper method to calculate statistics
func (s *IncidentService) calculateStatistics(
	incident *models.Incident,
	investigation *models.Investigation,
	actions []models.CorrectiveAction,
) SummaryStatistics {
	stats := SummaryStatistics{}

	// Calculate total days open
	if incident.ClosedAt.IsZero() {
		stats.TotalDaysOpen = int(time.Since(incident.CreatedAt).Hours() / 24)
	} else {
		stats.TotalDaysOpen = int(incident.ClosedAt.Sub(incident.CreatedAt).Hours() / 24)
	}

	// Calculate investigation duration
	if investigation != nil && !investigation.CompletedAt.IsZero() {
		stats.DaysInInvestigation = int(investigation.CompletedAt.Sub(investigation.StartedAt).Hours() / 24)
	}

	// Calculate action statistics
	stats.TotalActionsCount = len(actions)
	for _, action := range actions {
		if action.Status == "completed" || action.Status == "verified" {
			stats.CompletedActionsCount++
		}
	}

	// Calculate verification rate
	if stats.TotalActionsCount > 0 {
		stats.VerificationRate = float64(stats.CompletedActionsCount) / float64(stats.TotalActionsCount) * 100
	}

	return stats
}
