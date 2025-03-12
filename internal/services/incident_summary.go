package services

import (
	"errors"
	"fmt"
	"runtime/debug"
	"sort"
	"time"

	"github.com/gofiber/fiber/v2/log"
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
		log.Error("Failed to begin transaction: %v", tx.Error)
		return nil, fmt.Errorf("failed to begin transaction: %w", tx.Error)
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			// Log the full stack trace
			stack := debug.Stack()
			log.Errorf("Panic in GenerateIncidentSummary: %v\nStack Trace:\n%s", r, string(stack))
		}
	}()

	// Get incident details
	incident, err := s.GetIncident(incidentID)
	if err != nil {
		log.Error("Failed to get incident: %v", err)
		tx.Rollback()
		return nil, fmt.Errorf("failed to get incident: %w", err)
	}
	if incident == nil {
		log.Warn("No incident found for ID: %v", incidentID)
		tx.Rollback()
		return nil, fmt.Errorf("no incident found for ID: %v", incidentID)
	}
	summary.Incident = incident

	// Get investigation details
	var investigation models.Investigation
	if err := tx.Where("incident_id = ?", incidentID).First(&investigation).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Error("Failed to get investigation: %v", err)
			tx.Rollback()
			return nil, fmt.Errorf("failed to get investigation: %w", err)
		}
		log.Warn("No investigation found for incident ID: %v", incidentID)
	} else {
		summary.Investigation = &investigation
	}

	// Get corrective actions
	var actions []models.CorrectiveAction
	if err := tx.Where("incident_id = ?", incidentID).Find(&actions).Error; err != nil {
		log.Error("Failed to get corrective actions: %v", err)
		tx.Rollback()
		return nil, fmt.Errorf("failed to get corrective actions: %w", err)
	}
	summary.CorrectiveActions = actions

	// Get interviews
	var interviews []models.InvestigationInterview
	if summary.Investigation != nil {
		if err := tx.Where("investigation_id = ?", summary.Investigation.ID).Find(&interviews).Error; err != nil {
			log.Error("Failed to get interviews: %v", err)
			tx.Rollback()
			return nil, fmt.Errorf("failed to get interviews: %w", err)
		}
		summary.Interviews = interviews
	}

	// Get evidence
	var evidence []models.InvestigationEvidence
	if summary.Investigation != nil {
		if err := tx.Where("investigation_id = ?", summary.Investigation.ID).Find(&evidence).Error; err != nil {
			log.Error("Failed to get evidence: %v", err)
			tx.Rollback()
			return nil, fmt.Errorf("failed to get evidence: %w", err)
		}
		summary.Evidence = evidence
	}

	// Get action evidence
	var allActionEvidence []models.ActionEvidence
	for _, action := range actions {
		var evidence []models.ActionEvidence
		if err := tx.Where("corrective_action_id = ?", action.ID).Find(&evidence).Error; err != nil {
			log.Error("Failed to get action evidence for action %v: %v", action.ID, err)
			tx.Rollback()
			return nil, fmt.Errorf("failed to get action evidence: %w", err)
		}
		allActionEvidence = append(allActionEvidence, evidence...)
	}
	summary.ActionEvidence = allActionEvidence

	// Generate timeline
	summary.Timeline = s.generateTimeline(incident, summary.Investigation, actions, interviews)
	if len(summary.Timeline) == 0 {
		log.Warn("No timeline events generated for incident %v", incidentID)
	}

	// Calculate statistics
	// Before calling calculateStatistics
	if incident == nil {
		log.Warn("Cannot calculate statistics: incident is nil")
		return nil, errors.New("incident cannot be nil")
	}
	summary.Statistics = s.calculateStatistics(incident, summary.Investigation, actions)

	if err := tx.Commit().Error; err != nil {
		log.Error("Failed to commit transaction: %v", err)
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Final comprehensive validation
	if err := s.validateSummary(&summary); err != nil {
		log.Warn("Summary validation failed: %v", err)
		return nil, err
	}

	return &summary, nil
}

// Additional validation method
func (s *IncidentService) validateSummary(summary *IncidentSummary) error {
	if summary == nil {
		return errors.New("summary is nil")
	}

	if summary.Incident == nil {
		return errors.New("incident details are missing")
	}

	// Optional: Add more specific validation rules
	// For example, check if certain critical fields are populated
	if len(summary.CorrectiveActions) == 0 {
		log.Warn("No corrective actions found for incident %v", summary.Incident.ID)
	}

	return nil
}

// Helper method to generate timeline
func (s *IncidentService) generateTimeline(
	incident *models.Incident,
	investigation *models.Investigation,
	actions []models.CorrectiveAction,
	interviews []models.InvestigationInterview,
) []TimelineEvent {
	var timeline []TimelineEvent

	// Defensive nil checks
	if incident == nil {
		log.Warn("Cannot generate timeline: incident is nil")
		return timeline
	}

	// Add incident creation
	reporterName := "Unknown"
	if incident.Reporter.ID != uuid.Nil {
		reporterName = incident.Reporter.FirstName + " " + incident.Reporter.LastName
	}

	timeline = append(timeline, TimelineEvent{
		Date:        incident.CreatedAt,
		EventType:   "incident_created",
		Description: "Incident reported",
		UserID:      incident.ReportedBy,
		UserName:    reporterName,
	})

	// Add investigation events
	if investigation != nil {
		leadInvestigatorName := "Unknown"
		if investigation.LeadInvestigator.ID != uuid.Nil {
			leadInvestigatorName = investigation.LeadInvestigator.FirstName + " " + investigation.LeadInvestigator.LastName
		}

		timeline = append(timeline, TimelineEvent{
			Date:        investigation.StartedAt,
			EventType:   "investigation_started",
			Description: "Investigation initiated",
			UserID:      investigation.LeadInvestigatorID,
			UserName:    leadInvestigatorName,
		})
	}

	// Add interview events
	for _, interview := range interviews {
		intervieweeName := "Unknown"
		if interview.Interviewee.ID != uuid.Nil {
			intervieweeName = interview.Interviewee.FirstName + " " + interview.Interviewee.LastName
		}

		timeline = append(timeline, TimelineEvent{
			Date:        interview.ScheduledFor,
			EventType:   "interview_scheduled",
			Description: fmt.Sprintf("Interview scheduled with %s", intervieweeName),
			UserID:      interview.IntervieweeID,
			UserName:    intervieweeName,
		})
	}

	// Add corrective action events
	for _, action := range actions {
		assignerName := "Unknown"
		assigneeName := "Unknown"

		if action.Assigner.ID != uuid.Nil {
			assignerName = action.Assigner.FirstName + " " + action.Assigner.LastName
		}

		if action.Assignee.ID != uuid.Nil {
			assigneeName = action.Assignee.FirstName + " " + action.Assignee.LastName
		}

		timeline = append(timeline, TimelineEvent{
			Date:        action.CreatedAt,
			EventType:   "action_created",
			Description: fmt.Sprintf("Corrective action created: %s", action.Description),
			UserID:      action.AssignedBy,
			UserName:    assignerName,
		})

		if !action.CompletedAt.IsZero() {
			timeline = append(timeline, TimelineEvent{
				Date:        *action.CompletedAt,
				EventType:   "action_completed",
				Description: fmt.Sprintf("Corrective action completed: %s", action.Description),
				UserID:      action.AssignedTo,
				UserName:    assigneeName,
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

	// Defensive nil check for incident
	if incident == nil {
		log.Warn("Incident is nil in calculateStatistics")
		return stats
	}

	// Calculate total days open
	if incident.ClosedAt.IsZero() {
		stats.TotalDaysOpen = int(time.Since(incident.CreatedAt).Hours() / 24)
	} else {
		stats.TotalDaysOpen = int(incident.ClosedAt.Sub(incident.CreatedAt).Hours() / 24)
	}

	// Calculate investigation duration
	if investigation != nil {
		// Check if StartedAt is valid
		if !investigation.StartedAt.IsZero() {
			// Check if CompletedAt is valid (and not nil)
			if investigation.CompletedAt != nil && !investigation.CompletedAt.IsZero() {
				stats.DaysInInvestigation = int(investigation.CompletedAt.Sub(investigation.StartedAt).Hours() / 24)
			} else {
				// Calculate days since investigation started
				stats.DaysInInvestigation = int(time.Since(investigation.StartedAt).Hours() / 24)
			}
		}
	}
	// Calculate action statistics
	stats.TotalActionsCount = len(actions)
	for _, action := range actions {
		if action.Status == "completed" || action.Status == "verified" {
			stats.CompletedActionsCount++
		}
	}

	// Calculate verification rate (avoid division by zero)
	if stats.TotalActionsCount > 0 {
		stats.VerificationRate = float64(stats.CompletedActionsCount) / float64(stats.TotalActionsCount) * 100
	}

	return stats
}
