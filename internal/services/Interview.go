package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/schema"
	"gorm.io/gorm"
)

type InterviewService struct {
	db *gorm.DB
    notificationService NotificationService
    correctiveActionService CorrectiveActionService
}
func (s *InterviewService) UpdateInterviewStatus(interviewID uuid.UUID, status string, notes string) (*models.InvestigationInterview, error) {
	interview := &models.InvestigationInterview{}
	
	if err := s.db.First(interview, interviewID).Error; err != nil {
		return nil, err
	}
	
	interview.Status = status
	
	// If notes are provided, update them
	if notes != "" {
		interview.Notes = notes
	}
	
	// If status is completed, set CompletedAt timestamp
	if status == "completed" {
		interview.CompletedAt = time.Now()
	}
	
	if err := s.db.Save(interview).Error; err != nil {
		return nil, err
	}
	
	// Send notification about status change
	if err := s.notificationService.NotifyInterviewStatusChanged(interview, interview.Status); err != nil {
		log.Printf("Failed to send interview status notification: %v", err)
	}
	
	return interview, nil
 }
// Add these methods to the InvestigationService
func (s *InterviewService) ScheduleInterview(dto schema.CreateInterviewDTO) (*models.InvestigationInterview, error) {
	interview := &models.InvestigationInterview{
		InvestigationID: dto.InvestigationID,
		IntervieweeID:   dto.IntervieweeID,
		ScheduledFor:    dto.ScheduledFor,
		Location:        dto.Location,
		Status:          "scheduled",
	}

	if err := s.db.Create(interview).Error; err != nil {
		return nil, err
	}

	// Send notification to interviewee
	if err := s.notificationService.NotifyInterviewScheduled(interview); err != nil {
		// Log error but don't fail the operation
		log.Printf("Failed to send interview notification: %v", err)
	}

	return interview, nil
}

func (s *InterviewService) AddEvidence(dto schema.CreateEvidenceDTO) (*models.InvestigationEvidence, error) {
	evidence := &models.InvestigationEvidence{
		InvestigationID: dto.InvestigationID,
		EvidenceType:    dto.EvidenceType,
		Description:     dto.Description,
		FileURL:         dto.FileURL,
		CollectedAt:     time.Now(),
		CollectedBy:     dto.CollectedBy,
		StorageLocation: dto.StorageLocation,
	}

	return evidence, s.db.Create(evidence).Error
}

func (s *InterviewService) GetEvidence(evidenceID uuid.UUID) (*models.InvestigationEvidence, error) {
	var evidence models.InvestigationEvidence
	if err := s.db.First(&evidence, "id = ?", evidenceID).Error; err != nil {
		return nil, err
	}
	return &evidence, nil
}

// Add these methods to the CorrectiveActionService
// func (s *InterviewService) AddCompletionEvidence(ctx context.Context, actionID uuid.UUID, dto schema.CreateActionEvidenceDTO) (*models.ActionEvidence, error) {
// 	evidence := &models.ActionEvidence{
// 		CorrectiveActionID: actionID,
// 		FileType:           dto.FileType,
// 		FileName:           dto.FileName,
// 		FileURL:            dto.FileURL,
// 		UploadedBy:         dto.UploadedBy,
// 		Description:        dto.Description,
// 	}

// 	if err := s.db.Create(evidence).Error; err != nil {
// 		return nil, err
// 	}

// 	// Update action status if verification is not required
// 	action, err := s.correctiveActionService.GetByID(ctx, actionID)
// 	if err != nil {
// 		return nil, err
// 	}

// 	if !action.VerificationRequired {
// 		action.Status = "completed"
// 		action.CompletedAt = time.Now()
// 		if err := s.db.Save(action).Error; err != nil {
// 			return nil, err
// 		}
// 	}

// 	return evidence, nil
// }

func (s *InterviewService) VerifyCompletion(ctx context.Context,actionID uuid.UUID, verifierID uuid.UUID) error {
	action, err := s.correctiveActionService.InuseGetByID(ctx, actionID)
	if err != nil {
		return err
	}

	if !action.VerificationRequired {
		return fmt.Errorf("verification not required for this action")
	}

	now := time.Now()
	action.Status = "verified"
	action.VerifiedBy = &verifierID
	action.VerifiedAt = &now

	return s.db.Save(action).Error
}

// Method to track action deadlines and send notifications
func (s *InterviewService) MonitorDeadlines() error {
	var actionsNearDeadline []models.CorrectiveAction
	twoDaysFromNow := time.Now().Add(48 * time.Hour)

	err := s.db.Where("due_date <= ? AND status NOT IN ('completed', 'verified')", twoDaysFromNow).Find(&actionsNearDeadline).Error
	if err != nil {
		return err
	}

	for _, action := range actionsNearDeadline {
		if err := s.notificationService.NotifyActionDueSoon(&action); err != nil {
			log.Printf("Failed to send deadline notification for action %s: %v", action.ID, err)
		}
	}

	return nil
}

// Fetch interview details with evidence
func (s *InterviewService) GetInterviewDetails(ctx context.Context, interviewID uuid.UUID) (*schema.InvestigationInterviewResponse, error) {
	var interview models.InvestigationInterview
	err := s.db.WithContext(ctx).
		Preload("Interviewee").
		Preload("Investigation").
		First(&interview, "id = ?", interviewID).Error

	if err != nil {
		return nil, fmt.Errorf("interview not found: %w", err)
	}

	response := schema.ToInvestigationInterviewResponse(&interview)
	return &response, nil
}
// Fetch evidence details
func (s *InterviewService) GetEvidenceDetails(ctx context.Context, evidenceID uuid.UUID) (*schema.InvestigationEvidenceResponse, error) {
	var evidence models.InvestigationEvidence
	err := s.db.WithContext(ctx).
		Preload("Collector").
		Preload("Investigation").
		First(&evidence, "id = ?", evidenceID).Error

	if err != nil {
		return nil, fmt.Errorf("evidence not found: %w", err)
	}

	response := schema.ToInvestigationEvidenceResponse(&evidence)
	return &response, nil
}
