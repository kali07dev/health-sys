package services

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"gorm.io/gorm"
)

type NotificationType string

const (
	ActionAssigned     NotificationType = "action_assigned"
	ActionDueSoon      NotificationType = "action_due_soon"
	ActionOverdue      NotificationType = "action_overdue"
	InterviewScheduled NotificationType = "interview_scheduled"
)

type NotificationService struct {
	db           *gorm.DB
	emailService *EmailService
}

func NewNotificationService(db *gorm.DB, emailService *EmailService) (*NotificationService, error) {
	if db == nil {
		return nil, fmt.Errorf("database connection cannot be nil")
	}
	if emailService == nil {
		return nil, fmt.Errorf("email service cannot be nil")
	}
	return &NotificationService{db: db, emailService: emailService}, nil
}

func (s *NotificationService) TestMe() error{
	fmt.Println("Running........")
	return nil
}

// SendNotification sends a notification to a user and optionally sends an email
func (s *NotificationService) SendNotification(userID uuid.UUID, notificationType, title, message string, referenceID uuid.UUID, referenceType string) error {
	// Store the notification in the database
	log.Println(" notification meth start")

	notification := models.Notification{
		UserID:        userID,
		Type:          notificationType,
		Title:         title,
		Message:       message,
		ReferenceID:   referenceID,
		ReferenceType: referenceType,
	}

	if err := s.db.Create(&notification).Error; err != nil {
		log.Println("error created notification ")
		return err
	}
	log.Println("created notification ")

	// Fetch the user's email address
	var user models.User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		return err
	}
	log.Println("Fetched user ")

	// Send an email if the user has an email address
	if user.Email != "" {
		log.Println("email found notification ")

		emailSubject := title
		emailBody := message

		if err := s.emailService.SendEmail([]string{user.Email}, emailSubject, emailBody); err != nil {
			log.Println("Failed to send email to %s: %v", user.Email, err)
		}
	}

	// log.Println("Notification sent to user %s: %s", userID, title)
	log.Println("Notification sent to user ")
	return nil
}

// CheckAndSendReminders checks for unresolved issues, overdue corrective actions, and upcoming audits, and sends reminders
func (s *NotificationService) CheckAndSendReminders() error {
	// Check for unresolved incidents
	var unresolvedIncidents []models.Incident
	if err := s.db.Where("status IN ? AND assigned_to IS NOT NULL", []string{"new", "investigating", "action_required"}).Find(&unresolvedIncidents).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("no investigations found")
		}
		return err
	}
	// log.Println("Records found: %v", unresolvedIncidents)

	for _, incident := range unresolvedIncidents {
		log.Println("we found sht ")

		// Skip if no user is assigned
		if incident.AssignedTo == nil {
			log.Printf("Skipping notification for incident %s: no user assigned", incident.ID)
			continue
		}

		notificationTitle := "Unresolved Incident Reminder"
		notificationMessage := "There is an unresolved incident that requires your attention."
		if err := s.SendNotification(*incident.AssignedTo, "reminder", notificationTitle, notificationMessage, incident.ID, "incident"); err != nil {
			log.Printf("Failed to send notification for unresolved incident %s: %v", incident.ID, err)
		}
	}
	log.Println("Done func sent to user ")


	// Check for overdue corrective actions
	var overdueActions []models.CorrectiveAction
	if err := s.db.Where("status = ? AND due_date < ?", "pending", time.Now()).Find(&overdueActions).Error; err != nil {
		return err
	}

	for _, action := range overdueActions {
		notificationTitle := "Overdue Corrective Action Reminder"
		notificationMessage := "There is an overdue corrective action that requires your attention."
		if err := s.SendNotification(action.AssignedTo, "reminder", notificationTitle, notificationMessage, action.ID, "corrective_action"); err != nil {
			log.Printf("Failed to send notification for overdue corrective action %s: %v", action.ID, err)
		}
	}

	// Check for upcoming audits (if applicable)
	// This part can be customized based on audit system.

	return nil
}

// Background task to check for overdue actions
func (s *NotificationService) CheckOverdueActions() error {
	var overdueActions []models.CorrectiveAction
	now := time.Now()

	err := s.db.Where("due_date < ? AND status NOT IN ('completed', 'verified')", now).Find(&overdueActions).Error
	if err != nil {
		return err
	}

	for _, action := range overdueActions {
		notification := &models.Notification{
			UserID: action.AssignedTo,
			Type:   string(ActionOverdue),
			Title:  "Corrective Action Overdue",
			Message: fmt.Sprintf("Action '%s' is overdue. Due date was %s",
				action.Description,
				action.DueDate.Format("2006-01-02")),
		}

		if err := s.db.Create(notification).Error; err != nil {
			return err
		}
	}

	return nil
}

func (s *NotificationService) NotifyActionAssignment(action *models.CorrectiveAction, assignee *models.Employee) error {
	notification := &models.Notification{
		UserID: assignee.ID,
		Type:   string(ActionAssigned),
		Title:  "New Corrective Action Assigned",
		Message: fmt.Sprintf("You have been assigned a new corrective action: %s. Due date: %s",
			action.Description,
			action.DueDate.Format("2006-01-02")),
	}

	err := s.db.Create(notification).Error
	if err != nil {
		return err
	}

	// Fetch the user's email address
	var user models.User
	if err := s.db.First(&user, "id = ?", assignee.UserID).Error; err != nil {
		return err
	}

	// Send an email if the user has an email address
	if user.Email != "" {
		emailSubject := notification.Title
		emailBody := notification.Message

		if err := s.emailService.SendEmail([]string{user.Email}, emailSubject, emailBody); err != nil {
			log.Printf("Failed to send email to %s: %v", user.Email, err)
		}
	}

	log.Printf("Notification sent to user %s: %s", fmt.Sprintf("%s %s", assignee.FirstName, assignee.LastName), notification.Title)
	return nil
}

func (s *NotificationService) NotifyActionDueSoon(action *models.CorrectiveAction) error {
	notification := &models.Notification{
		UserID:  action.AssignedTo,
		Type:    string(ActionDueSoon),
		Title:   "Corrective Action Due Soon",
		Message: fmt.Sprintf("Action '%s' is due in 48 hours", action.Description),
	}

	return s.db.Create(notification).Error
}

func (s *NotificationService) NotifyInterviewScheduled(interview *models.InvestigationInterview) error {
	notification := &models.Notification{
		UserID: interview.IntervieweeID,
		Type:   string(InterviewScheduled),
		Title:  "Investigation Interview Scheduled",
		Message: fmt.Sprintf("You have been scheduled for an interview on %s at %s",
			interview.ScheduledFor.Format("2006-01-02"),
			interview.ScheduledFor.Format("15:04")),
	}

	return s.db.Create(notification).Error
}
