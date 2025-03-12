package services

import (
	"errors"
	"fmt"
	"html/template"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/schema"
	"gorm.io/gorm"
)

type NotificationType string

const (
	ActionAssigned     NotificationType = "action_assigned"
	ActionDueSoon      NotificationType = "action_due_soon"
	ActionOverdue      NotificationType = "action_overdue"
	UrgentIncident      NotificationType = "urgent_incident"
	InterviewScheduled NotificationType = "interview_scheduled"
	InvestigationAssigned NotificationType = "investigation_assigned"
	InterviewStatusChanged NotificationType = "interview_status_changed"
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

// SendNotification handles both database storage and email sending
func (s *NotificationService) SendNotification(userID uuid.UUID, notificationType, title, message string, referenceID uuid.UUID, referenceType string) error {
    // Store notification in database
    notification := models.Notification{
        UserID:        userID,
        Type:          notificationType,
        Title:         title,
        Message:       message,
        ReferenceID:   referenceID,
        ReferenceType: referenceType,
    }

    if err := s.db.Create(&notification).Error; err != nil {
        log.Printf("Failed to create notification record: %v", err)
        return err
    }

    // Fetch user details
    var user models.User
    if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
        log.Printf("Failed to fetch user: %v", err)
        return err
    }

    // Skip email if user has no email address
    if user.Email == "" {
        log.Printf("No email address found for user %s", userID)
        return nil
    }

    // Prepare email based on notification type
    var emailErr error
    switch NotificationType(notificationType) {
    case ActionAssigned:
        var action models.CorrectiveAction
        if err := s.db.First(&action, "id = ?", referenceID).Error; err != nil {
            log.Printf("Failed to fetch action: %v", err)
            break
        }
        emailErr = s.emailService.sendActionAssignedEmail([]string{user.Email}, &action)

    case ActionDueSoon:
        var action models.CorrectiveAction
        if err := s.db.First(&action, "id = ?", referenceID).Error; err != nil {
            log.Printf("Failed to fetch action: %v", err)
            break
        }
        emailErr = s.emailService.sendActionDueSoonEmail([]string{user.Email}, &action)

    case ActionOverdue:
        var action models.CorrectiveAction
        if err := s.db.First(&action, "id = ?", referenceID).Error; err != nil {
            log.Printf("Failed to fetch action: %v", err)
            break
        }
        emailErr = s.emailService.sendActionOverdueEmail([]string{user.Email}, &action)

    case UrgentIncident:
        var incident schema.CreateIncidentRequest
        // if err := s.db.First(&incident, "id = ?", referenceID).Error; err != nil {
        //     log.Printf("Failed to fetch incident: %v", err)
        //     break
        // }
        emailErr = s.emailService.sendUrgentIncidentEmail([]string{user.Email}, &incident)

    case InterviewScheduled:
        var interview models.InvestigationInterview
        if err := s.db.First(&interview, "id = ?", referenceID).Error; err != nil {
            log.Printf("Failed to fetch interview: %v", err)
            break
        }
        emailErr = s.emailService.sendInterviewScheduledEmail([]string{user.Email}, &interview)

    default:
        // For unknown types, send generic email
        emailErr = s.emailService.SendEmail([]string{user.Email}, title, template.HTML(message))
    }

    if emailErr != nil {
        log.Printf("Failed to send email notification: %v", emailErr)
        // Don't return error as notification is already stored in DB
    }

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
		if err := s.SendNotification(*incident.AssignedTo, "action_assigned", notificationTitle, notificationMessage, incident.ID, "incident"); err != nil {
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

// NotifyActionAssignment updated to use templated email
func (s *NotificationService) NotifyActionAssignment(action *models.CorrectiveAction, assignee *models.Employee) error {
    notification := &models.Notification{
        UserID: assignee.UserID,
        Type:   string(ActionAssigned),
        Title:  "New Corrective Action Assigned",
        Message: fmt.Sprintf("You have been assigned a new corrective action: %s. Due date: %s",
            action.Description,
            action.DueDate.Format("2006-01-02")),
        ReferenceID:   action.ID,
        ReferenceType: "corrective_action",
    }

    return s.SendNotification(
        notification.UserID,
        notification.Type,
        notification.Title,
        notification.Message,
        notification.ReferenceID,
        notification.ReferenceType,
    )
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
func (s *NotificationService) NotifyInterviewStatusChanged(interview *models.InvestigationInterview, status string) error {
	// Define the notification message based on the status
	var message string
	switch status {
	case "rescheduled":
		message = fmt.Sprintf("Your interview has been rescheduled to %s at %s",
			interview.ScheduledFor.Format("2006-01-02"),
			interview.ScheduledFor.Format("15:04"))
	case "canceled":
		message = "Your interview has been canceled."
	case "completed":
		message = "Your interview has been completed."
	default:
		message = "There has been a change in your interview status."
	}

	// Create the notification
	notification := &models.Notification{
		UserID:  interview.IntervieweeID,
		Type:    string(InterviewStatusChanged),
		Title:   "Investigation Interview Status Changed",
		Message: message,
	}

	// Save the notification to the database
	return s.db.Create(notification).Error
}

func (s *NotificationService) NotifyInvestigationLeader(interview *models.Investigation) error {
	var user models.Employee
    if err := s.db.First(&user, "id = ?", interview.LeadInvestigatorID).Preload("User").Error; err != nil {
        log.Printf("Failed to fetch user: %v", err)
        return err
    }
	notification := &models.Notification{
		UserID: user.UserID,
		Type:   string(InvestigationAssigned),
		Title:  "You have been Assigned as the lead Investigator",
		Message: fmt.Sprintf("You have been scheduled the lead Investigator for the incident %s on %s at %s",
			interview.Incident.Description,
			interview.StartedAt.Format("2006-01-02"),
			interview.StartedAt.Format("15:04")),
	}

	if err := s.db.Create(&notification).Error; err != nil {
        log.Printf("Failed to create notification record: %v", err)
        return err
    }
	
	emailErr := s.emailService.sendLeadInvestigatorAssignedEmail([]string{user.User.Email}, interview, &interview.Incident)
	if emailErr != nil {
        log.Printf("Failed to send email notification: %v", emailErr)
    }
	return nil
}