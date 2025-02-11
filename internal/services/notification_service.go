package services

import (
	"context"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"gorm.io/gorm"
)

type NotificationService struct {
	db           *gorm.DB
	emailService *EmailService
}

func NewNotificationService(db *gorm.DB, emailService *EmailService) *NotificationService {
	return &NotificationService{db: db, emailService: emailService}
}


// SendNotification sends a notification to a user and optionally sends an email
func (s *NotificationService) SendNotification(ctx context.Context, userID uuid.UUID, notificationType, title, message string, referenceID uuid.UUID, referenceType string) error {
	// Store the notification in the database
	notification := models.Notification{
		UserID:        userID,
		Type:          notificationType,
		Title:         title,
		Message:       message,
		ReferenceID:   referenceID,
		ReferenceType: referenceType,
	}

	if err := s.db.WithContext(ctx).Create(&notification).Error; err != nil {
		return err
	}

	// Fetch the user's email address
	var user models.User
	if err := s.db.WithContext(ctx).First(&user, "id = ?", userID).Error; err != nil {
		return err
	}

	// Send an email if the user has an email address
	if user.Email != "" {
		emailSubject := title
		emailBody := message

		if err := s.emailService.SendEmail([]string{user.Email}, emailSubject, emailBody); err != nil {
			log.Printf("Failed to send email to %s: %v", user.Email, err)
		}
	}

	log.Printf("Notification sent to user %s: %s", userID, title)
	return nil
}
// CheckAndSendReminders checks for unresolved issues, overdue corrective actions, and upcoming audits, and sends reminders
func (s *NotificationService) CheckAndSendReminders(ctx context.Context) error {
	// Check for unresolved incidents
	var unresolvedIncidents []models.Incident
	if err := s.db.WithContext(ctx).Where("status IN ?", []string{"new", "investigating", "action_required"}).Find(&unresolvedIncidents).Error; err != nil {
		return err
	}

	for _, incident := range unresolvedIncidents {
		notificationTitle := "Unresolved Incident Reminder"
		notificationMessage := "There is an unresolved incident that requires your attention."
		if err := s.SendNotification(ctx, *incident.AssignedTo, "reminder", notificationTitle, notificationMessage, incident.ID, "incident"); err != nil {
			log.Printf("Failed to send notification for unresolved incident %s: %v", incident.ID, err)
		}
	}

	// Check for overdue corrective actions
	var overdueActions []models.CorrectiveAction
	if err := s.db.WithContext(ctx).Where("status = ? AND due_date < ?", "pending", time.Now()).Find(&overdueActions).Error; err != nil {
		return err
	}

	for _, action := range overdueActions {
		notificationTitle := "Overdue Corrective Action Reminder"
		notificationMessage := "There is an overdue corrective action that requires your attention."
		if err := s.SendNotification(ctx, action.AssignedTo, "reminder", notificationTitle, notificationMessage, action.ID, "corrective_action"); err != nil {
			log.Printf("Failed to send notification for overdue corrective action %s: %v", action.ID, err)
		}
	}

	// Check for upcoming audits (if applicable)
	// This part can be customized based on your audit system.

	return nil
}
