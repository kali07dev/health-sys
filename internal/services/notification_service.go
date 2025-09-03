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
	ActionAssigned         NotificationType = "action_assigned"
	ActionDueSoon          NotificationType = "action_due_soon"
	ActionOverdue          NotificationType = "action_overdue"
	UrgentIncident         NotificationType = "urgent_incident"
	InterviewScheduled     NotificationType = "interview_scheduled"
	InvestigationAssigned  NotificationType = "investigation_assigned"
	InterviewStatusChanged NotificationType = "interview_status_changed"
	VpcCreated             NotificationType = "vpc_created"
	ExtensionRequested     NotificationType = "extension_requested" // New notification type
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

func (s *NotificationService) TestMe() error {
	fmt.Println("Running........")
	return nil
}
func (s *NotificationService) GetEmployeeByID(id uuid.UUID) (*models.Employee, error) {
	var employee models.Employee
	err := s.db.First(&employee, "id = ?", id).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get employee by employee ID: %w", err)
	}
	return &employee, err
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

	case VpcCreated:
		var vpc models.VPC
		if err := s.db.First(&vpc, "id = ?", referenceID).Error; err != nil {
			log.Printf("Failed to fetch VPC: %v", err)
			break
		}
		emailErr = s.emailService.sendVPCNotificationEmail([]string{user.Email}, &vpc)

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
		// log.Println("we found Incidents ")

		// Skip if no user is assigned
		if incident.AssignedTo == nil {
			log.Printf("Skipping notification for incident %s: no user assigned", incident.ID)
			continue
		}
		user, err := s.GetEmployeeByID(*incident.AssignedTo)
		if err != nil {
			return fmt.Errorf("failed to get employee by employee ID: %w", err)
		}

		notificationTitle := "Unresolved Incident Reminder"
		notificationMessage := "There is an unresolved incident that requires your attention."
		if err := s.SendNotification(user.UserID, "action_assigned", notificationTitle, notificationMessage, incident.ID, "incident"); err != nil {
			log.Printf("Failed to send notification for unresolved incident %s: %v", incident.ID, err)
		}
	}
	log.Println("Done sending notifications to users ")

	// Check for overdue corrective actions
	var overdueActions []models.CorrectiveAction
	if err := s.db.Where("status = ? AND due_date < ?", "pending", time.Now()).Find(&overdueActions).Error; err != nil {
		return err
	}

	for _, action := range overdueActions {
		user, err := s.GetEmployeeByID(action.AssignedTo)
		if err != nil {
			return fmt.Errorf("failed to get employee by employee ID: %w", err)
		}
		notificationTitle := "Overdue Corrective Action Reminder"
		notificationMessage := fmt.Sprintf("There is an overdue corrective action that requires your attention. %s", action.Description)
		if err := s.SendNotification(user.UserID, "action_overdue", notificationTitle, notificationMessage, action.ID, "corrective_action"); err != nil {
			log.Printf("Failed to send notification for overdue corrective action %s: %v", action.ID, err)
		}
	}

	// Check for upcoming audits (if applicable)
	// This part can be customized based on audit system.

	var actionsNearDeadline []models.CorrectiveAction
	twoDaysFromNow := time.Now().Add(48 * time.Hour)

	err := s.db.Where("due_date <= ? AND status NOT IN ('completed', 'verified')", twoDaysFromNow).Find(&actionsNearDeadline).Error
	if err != nil {
		return err
	}

	for _, action := range actionsNearDeadline {

		user, err := s.GetEmployeeByID(action.AssignedTo)
		if err != nil {
			return fmt.Errorf("failed to get employee by employee ID: %w", err)
		}
		notificationTitle := "Upcoming Corrective Action Deadline Reminder"
		notificationMessage := fmt.Sprintf("There is an overdue corrective action that requires your attention. %s", action.Description)

		if err := s.SendNotification(user.UserID, string(ActionDueSoon),
			notificationTitle, notificationMessage, action.ID,
			"corrective_action"); err != nil {
			log.Printf("Failed to send deadline notification for action %s: %v", action.ID, err)
		}
	}

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

// NotifyExtensionRequested sends notifications when a user requests an extension for a corrective action
func (s *NotificationService) NotifyExtensionRequested(action *models.CorrectiveAction, requestor *models.Employee) error {
	// Create notification for the action assignor/supervisor
	notificationTitle := "Extension Requested for Corrective Action"
	notificationMessage := fmt.Sprintf(
		"Employee %s %s has requested an extension for corrective action '%s'. Reason: %s. New proposed due date: %s",
		requestor.FirstName,
		requestor.LastName,
		action.Description,
		action.ExtensionReason,
		action.DueDate,
	)

	// Find the person who assigned the action (supervisor/manager)
	var assignor models.Employee
	if err := s.db.First(&assignor, "id = ?", action.AssignedBy).Error; err != nil {
		log.Printf("Failed to fetch assignor: %v", err)
		return fmt.Errorf("failed to fetch assignor: %w", err)
	}

	// Send notification to the assignor
	if err := s.SendNotification(
		assignor.UserID,
		string(ExtensionRequested),
		notificationTitle,
		notificationMessage,
		action.ID,
		"corrective_action",
	); err != nil {
		log.Printf("Failed to send extension request notification: %v", err)
		return err
	}

	// If we have an email service configured, send an email as well
	if s.emailService != nil && assignor.User.Email != "" {
		var user models.User
		if err := s.db.First(&user, "id = ?", assignor.UserID).Error; err == nil && user.Email != "" {
			// Send email notification
			emailContent := fmt.Sprintf(`
                <h3>Extension Request for Corrective Action</h3>
                <p>Employee %s %s has requested an extension for a corrective action.</p>
                <p><strong>Action:</strong> %s</p>
                <p><strong>Current Due Date:</strong> %s</p>
                <p><strong>Requested New Due Date:</strong> %s</p>
                <p><strong>Reason:</strong> %s</p>
                <p>Please review this request and take appropriate action.</p>
            `,
				requestor.FirstName,
				requestor.LastName,
				action.Description,
				action.PreviousDueDate,
				action.DueDate,
				action.ExtensionReason,
			)

			s.emailService.SendEmail([]string{user.Email}, notificationTitle, template.HTML(emailContent))
		}
	}

	return nil
}
