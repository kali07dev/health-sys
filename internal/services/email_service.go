package services

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"html/template"
	"log"
	"net"
	"net/smtp"
	"strings"
	"time"

	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/schema"
)

type EmailService struct {
	smtpHost     string
	smtpPort     int
	smtpUsername string
	smtpPassword string
	useTLS       bool
	timeout      time.Duration
}
type EmailTemplate struct {
	Subject     string
	Title       string
	Message     template.HTML
	ActionLink  string
	ActionText  string
	CompanyName string
}
type NotificationData struct {
    To       []string
    Title    string
    Message  string
    Action   *models.CorrectiveAction
    Incident *schema.CreateIncidentRequest
    Interview *models.InvestigationInterview
}

// NewEmailService creates a new EmailService instance with timeout
func NewEmailService(host string, port int, username, password string, useTLS bool) *EmailService {
	return &EmailService{
		smtpHost:     host,
		smtpPort:     port,
		smtpUsername: username,
		smtpPassword: password,
		useTLS:       useTLS,
		timeout:      30 * time.Second, // Default timeout
	}
}

// SetTimeout allows customizing the connection timeout
func (s *EmailService) SetTimeout(timeout time.Duration) {
	s.timeout = timeout
}

// TestConnection tests the SMTP connection without sending an email
func (s *EmailService) TestConnection() error {
	addr := fmt.Sprintf("%s:%d", s.smtpHost, s.smtpPort)

	// First test basic TCP connection
	conn, err := net.DialTimeout("tcp", addr, s.timeout)
	if err != nil {
		return fmt.Errorf("TCP connection failed: %v", err)
	}
	conn.Close()

	// Test SMTP connection with STARTTLS
	client, err := smtp.Dial(addr)
	if err != nil {
		return fmt.Errorf("SMTP connection failed: %v", err)
	}
	defer client.Close()

	// Try EHLO
	if err := client.Hello("localhost"); err != nil {
		return fmt.Errorf("EHLO failed: %v", err)
	}

	// Check if server supports STARTTLS
	if ok, _ := client.Extension("STARTTLS"); !ok {
		return fmt.Errorf("server doesn't support STARTTLS")
	}

	// Try STARTTLS
	tlsConfig := &tls.Config{
		ServerName: s.smtpHost,
		MinVersion: tls.VersionTLS12,
	}
	if err := client.StartTLS(tlsConfig); err != nil {
		return fmt.Errorf("STARTTLS failed: %v", err)
	}

	// Try authentication
	auth := smtp.PlainAuth("", s.smtpUsername, s.smtpPassword, s.smtpHost)
	if err := client.Auth(auth); err != nil {
		return fmt.Errorf("authentication failed: %v", err)
	}

	return nil
}

// SendEmail sends an email to a list of recipients
func (s *EmailService) SendEmail(to []string, subject string, body template.HTML) error {
	if len(to) == 0 {
		return fmt.Errorf("recipient list cannot be empty")
	}
    template := &EmailTemplate{
        Subject:     subject,
        Title:       subject,
        Message:     body,
        CompanyName: "Safety365 System",
    }
	htmlContent, err := s.generateHTMLEmail(template)
	if err != nil {
		return fmt.Errorf("failed to generate HTML email: %v", err)
	}

	// Create email content
	headers := make([]string, 0)
	headers = append(headers, fmt.Sprintf("From: %s", s.smtpUsername))
	headers = append(headers, fmt.Sprintf("To: %s", strings.Join(to, ", ")))
	headers = append(headers, fmt.Sprintf("Subject: %s", subject))
	headers = append(headers, "MIME-Version: 1.0")
	headers = append(headers, "Content-Type: text/html; charset=UTF-8")

	emailContent := strings.Join(headers, "\r\n") + "\r\n\r\n" + htmlContent

	// Set up dialer with timeout
	dialer := &net.Dialer{
		Timeout: s.timeout,
	}

	addr := fmt.Sprintf("%s:%d", s.smtpHost, s.smtpPort)

	var client *smtp.Client
	// var err error

	if s.useTLS {
		// Direct TLS connection
		conn, err := tls.DialWithDialer(dialer, "tcp", addr, &tls.Config{
			ServerName: s.smtpHost,
			MinVersion: tls.VersionTLS12,
		})
		if err != nil {
			return fmt.Errorf("TLS connection failed: %v", err)
		}
		defer conn.Close()

		client, err = smtp.NewClient(conn, s.smtpHost)
	} else {
		// Plain connection first, then STARTTLS
		conn, err := dialer.Dial("tcp", addr)
		if err != nil {
			return fmt.Errorf("TCP connection failed: %v", err)
		}

		client, err = smtp.NewClient(conn, s.smtpHost)
		if err != nil {
			conn.Close()
			return fmt.Errorf("SMTP client creation failed: %v", err)
		}

		// Send EHLO
		if err := client.Hello("localhost"); err != nil {
			client.Close()
			return fmt.Errorf("EHLO failed: %v", err)
		}

		// Start TLS
		if err := client.StartTLS(&tls.Config{
			ServerName: s.smtpHost,
			MinVersion: tls.VersionTLS12,
		}); err != nil {
			client.Close()
			return fmt.Errorf("STARTTLS failed: %v", err)
		}
	}
	defer client.Close()

	// Authenticate
	auth := smtp.PlainAuth("", s.smtpUsername, s.smtpPassword, s.smtpHost)
	if err := client.Auth(auth); err != nil {
		return fmt.Errorf("authentication failed: %v", err)
	}

	// Set sender
	if err := client.Mail(s.smtpUsername); err != nil {
		return fmt.Errorf("failed to set sender: %v", err)
	}

	// Add recipients
	for _, recipient := range to {
		if err := client.Rcpt(recipient); err != nil {
			return fmt.Errorf("failed to add recipient %s: %v", recipient, err)
		}
	}

	// Send the email body
	writer, err := client.Data()
	if err != nil {
		return fmt.Errorf("failed to create message writer: %v", err)
	}
	defer writer.Close()

	if _, err := writer.Write([]byte(emailContent)); err != nil {
		return fmt.Errorf("failed to write message: %v", err)
	}

	log.Printf("Successfully sent email to %v", to)
	return nil
}

func (s *EmailService) generateHTMLEmail(emailTmpl *EmailTemplate) (string, error) {
	const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            /* Modern, Apple-inspired styles */
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                line-height: 1.6;
                color: #1d1d1f;
                margin: 0;
                padding: 0;
                background-color: #f5f5f7;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 40px 20px;
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.05);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                width: 40px;
                height: 40px;
                margin-bottom: 20px;
            }
            .title {
                font-size: 24px;
                font-weight: 600;
                color: #1d1d1f;
                margin-bottom: 10px;
            }
            .message {
                font-size: 16px;
                color: #424245;
                margin-bottom: 30px;
                padding: 0 20px;
            }
            .action-button {
                display: inline-block;
                background-color: #0071e3;
                color: #ffffff;
                padding: 12px 30px;
                border-radius: 980px;
                text-decoration: none;
                font-size: 16px;
                font-weight: 500;
                margin-bottom: 30px;
                transition: background-color 0.2s;
            }
            .action-button:hover {
                background-color: #0077ed;
            }
            .footer {
                text-align: center;
                font-size: 12px;
                color: #86868b;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #d2d2d7;
            }
            @media (max-width: 480px) {
                .container {
                    padding: 20px 15px;
                }
                .title {
                    font-size: 20px;
                }
                .message {
                    font-size: 15px;
                    padding: 0 10px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="title">{{.Title}}</div>
            </div>
            <div class="message">
                {{.Message}}
            </div>
            {{if .ActionLink}}
            <div style="text-align: center;">
                <a href="{{.ActionLink}}" class="action-button">{{.ActionText}}</a>
            </div>
            {{end}}
            <div class="footer">
                <p>&copy; {{.CompanyName}}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`
	tmpl, err := template.New("email").Parse(htmlTemplate)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, emailTmpl); err != nil {
		return "", err
	}

	return buf.String(), nil
}

// NotifyActionAssignment template
func (s *EmailService) sendActionAssignmentEmail(to []string, action *models.CorrectiveAction) error {
	template := &EmailTemplate{
		Subject: "New Corrective Action Assigned",
		Title:   "New Task Assignment",
        Message: template.HTML(fmt.Sprintf(`
            <div style="background-color: #f5f5f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1d1d1f; margin-bottom: 15px;">Task Details</h3>
                <p><strong>Description:</strong> %s</p>
                <p><strong>Due Date:</strong> %s</p>
                <p style="color: #424245; margin-top: 15px;">Please review and begin working on this task as soon as possible.</p>
            </div>`,
            action.Description,
            action.DueDate.Format("January 2, 2006"))),
		ActionLink: fmt.Sprintf("/actions/%s", action.ID),
		ActionText: "View Task Details",
	}

	return s.SendEmail(to, template.Subject, template.Message)
}

// NotifyActionDueSoon template
func (s *EmailService) sendActionDueSoonEmail(to []string, action *models.CorrectiveAction) error {
	template := &EmailTemplate{
		Subject: "⚠️ Action Due Soon",
		Title:   "Upcoming Deadline",
		Message: template.HTML(fmt.Sprintf(`
			<div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
				<h3 style="color: #e65100; margin-bottom: 15px;">Action Required Soon</h3>
				<p><strong>Task:</strong> %s</p>
				<p><strong>Due Date:</strong> %s</p>
				<p style="color: #424245; margin-top: 15px;">This task requires your attention. Please complete it before the deadline.</p>
			</div>`,
			action.Description,
			action.DueDate.Format("January 2, 2006"))),
		ActionLink: fmt.Sprintf("/actions/%s", action.ID),
		ActionText: "Review Task",
	}

	return s.SendEmail(to, template.Subject, template.Message)
}

// NotifyInterviewScheduled template
func (s *EmailService) sendInterviewScheduledEmail(to []string, interview *models.InvestigationInterview) error {
	template := &EmailTemplate{
		Subject: "Interview Scheduled",
		Title:   "Investigation Interview Details",
		Message: template.HTML(fmt.Sprintf(`
			<div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
				<h3 style="color: #2e7d32; margin-bottom: 15px;">Interview Scheduled</h3>
				<div style="background-color: white; padding: 15px; border-radius: 6px;">
					<p><strong>Date:</strong> %s</p>
					<p><strong>Time:</strong> %s</p>
					<p><strong>Location:</strong> %s</p>
				</div>
				<p style="color: #424245; margin-top: 15px;">Please ensure you arrive 5 minutes before the scheduled time.</p>
			</div>`,
			interview.ScheduledFor.Format("Monday, January 2, 2006"),
			interview.ScheduledFor.Format("3:04 PM"),
			interview.Location)),
		ActionLink: fmt.Sprintf("/interviews/%s", interview.ID),
		ActionText: "Add to Calendar",
	}

	return s.SendEmail(to, template.Subject, template.Message)
}
// NotifyUrgentIncident sends urgent notifications to all managers for severe incidents
func (s *EmailService) sendUrgentIncidentEmail(to []string, incident *schema.CreateIncidentRequest) error {
    template := &EmailTemplate{
        Subject: "🚨 URGENT: Critical Incident Reported",
        Title:   "Critical Incident Alert",
        Message: template.HTML(fmt.Sprintf(`
            <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #c62828; margin-bottom: 15px;">⚠️ Critical Incident Reported</h3>
                <div style="background-color: white; padding: 15px; border-radius: 6px;">
                    <p><strong>Type:</strong> %s</p>
                    <p><strong>Severity:</strong> %s</p>
                    <p><strong>Location:</strong> %s</p>
                    <p><strong>Time of Incident:</strong> %s</p>
                    <p><strong>Description:</strong> %s</p>
                    <p><strong>Immediate Actions Taken:</strong> %s</p>
                </div>
                <p style="color: #b71c1c; margin-top: 15px; font-weight: bold;">
                    This incident requires immediate attention and review.
                </p>
            </div>`,
            incident.Type,
            incident.SeverityLevel,
            incident.Location,
            incident.OccurredAt.Format("January 2, 2006 3:04 PM"),
            incident.Description,
            incident.ImmediateActionsTaken)),
        ActionLink: "/incidents/urgent",
        ActionText: "Review Incident",
    }

    return s.SendEmail(to, template.Subject, template.Message)
}
// SendNotification handles different types of notifications
func (s *EmailService) SendNotification(notificationType NotificationType, data *NotificationData) error {
    var err error

    switch notificationType {
    case ActionAssigned:
        err = s.sendActionAssignedEmail(data.To, data.Action)
    case ActionDueSoon:
        err = s.sendActionDueSoonEmail(data.To, data.Action)
    case ActionOverdue:
        err = s.sendActionOverdueEmail(data.To, data.Action)
    case InterviewScheduled:
        err = s.sendInterviewScheduledEmail(data.To, data.Interview)
    case UrgentIncident:
        err = s.sendUrgentIncidentEmail(data.To, data.Incident)
    default:
        return fmt.Errorf("unknown notification type: %s", notificationType)
    }

    if err != nil {
        log.Printf("Failed to send %s notification: %v", notificationType, err)
        return err
    }

    return nil
}

// sendActionAssignedEmail sends a notification for a newly assigned action
func (s *EmailService) sendActionAssignedEmail(to []string, action *models.CorrectiveAction) error {
    template := &EmailTemplate{
        Subject: "New Action Item Assigned",
        Title:   "Action Item Assignment",
        Message: template.HTML(fmt.Sprintf(`
            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1976d2; margin-bottom: 15px;">New Action Item</h3>
                <div style="background-color: white; padding: 15px; border-radius: 6px;">
                    <p><strong>Priority:</strong> <span style="color: %s">%s</span></p>
                    <p><strong>Description:</strong> %s</p>
                    <p><strong>Due Date:</strong> %s</p>
                    <p><strong>Status:</strong> %s</p>
                    %s
                </div>
                <div style="margin-top: 15px; color: #1976d2;">
                    <p>Please review and begin working on this action item at your earliest convenience.</p>
                    <p><strong>Next Steps:</strong></p>
                    <ul style="margin-top: 5px;">
                        <li>Review the action details</li>
                        <li>Update the status as you progress</li>
                        <li>Complete before the due date</li>
                    </ul>
                </div>
            </div>`,
            getPriorityColor(action.Priority),
            action.Priority,
            action.Description,
            action.DueDate.Format("Monday, January 2, 2006"),
            action.Status,
            getAdditionalContext(action))),
        ActionLink: fmt.Sprintf("/actions/%s", action.ID),
        ActionText: "View Action Details",
    }

    return s.SendEmail(to, template.Subject, template.Message)
}

// sendActionOverdueEmail sends a notification for an overdue action
func (s *EmailService) sendActionOverdueEmail(to []string, action *models.CorrectiveAction) error {
    template := &EmailTemplate{
        Subject: "⚠️ OVERDUE: Action Item Requires Immediate Attention",
        Title:   "Overdue Action Item",
        Message: template.HTML(fmt.Sprintf(`
            <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #c62828; margin-bottom: 15px;">⚠️ Action Item Overdue</h3>
                <div style="background-color: white; padding: 15px; border-radius: 6px;">
                    <p><strong>Description:</strong> %s</p>
                    <p><strong>Due Date:</strong> %s</p>
                    <p><strong>Days Overdue:</strong> %d</p>
                    <p><strong>Current Status:</strong> %s</p>
                </div>
                <p style="color: #b71c1c; margin-top: 15px; font-weight: bold;">
                    This action item requires your immediate attention.
                </p>
            </div>`,
            action.Description,
            action.DueDate.Format("January 2, 2006"),
            int(time.Since(action.DueDate).Hours()/24),
            action.Status)),
        ActionLink: fmt.Sprintf("/actions/%s", action.ID),
        ActionText: "Update Action Item",
    }

    return s.SendEmail(to, template.Subject, template.Message)
}

// Helper functions for email templates
func getPriorityColor(priority string) string {
    switch strings.ToLower(priority) {
    case "high":
        return "#c62828"
    case "medium":
        return "#f57c00"
    default:
        return "#2e7d32"
    }
}

func getAdditionalContext(action *models.CorrectiveAction) string {
    if action.Description == "" {
        return ""
    }
    return fmt.Sprintf(`
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0;">
            <p><strong>Additional Context:</strong></p>
            <p>%s</p>
        </div>`,
        action.Description)
}
func InvestigationAdditionalContext(action *models.Incident) string {
    if action.Description == "" {
        return ""
    }
    return fmt.Sprintf(`
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0;">
            <p><strong>Additional Incident Context:</strong></p>
            <p>Description : %s</p>
            <p>Type : %s</p>
            <p>Location : %s</p>
            <p>ImmediateActionsTaken : %s</p>
        </div>`,
        action.Description,
        action.Type,
        action.Location,
        action.ImmediateActionsTaken,
    )
}

func (s *EmailService) sendVerificationEmail(to []string, verificationLink string) error {
    template := &EmailTemplate{
        Subject: "Verify Your Account",
        Title:   "Welcome! Please Verify Your Account",
        Message: template.HTML(fmt.Sprintf(`
            <div style="background-color: #f5f5f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1d1d1f; margin-bottom: 15px;">Welcome to Safety365 System</h3>
                <p>To complete your account setup, please click the button below to verify your email address and set up your password.</p>
                <p>This link will expire in 24 hours for security purposes.</p>
                <div style="margin-top: 20px; margin-bottom: 20px; text-align: center;">
                    <a href="%s" style="background-color: #0071e3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500;">Verify Account</a>
                </div>
                <p style="color: #424245; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
            </div>`,
            verificationLink)),
        ActionLink:  verificationLink,
        ActionText:  "Verify Account",
        CompanyName: "Safety365 System",
    }

    return s.SendEmail(to, template.Subject, template.Message)
}

func (s *EmailService) sendPasswordResetEmail(to []string, resetLink string) error {
    template := &EmailTemplate{
        Subject: "Reset Your Password",
        Title:   "Password Reset Request",
        Message: template.HTML(fmt.Sprintf(`
            <div style="background-color: #f5f5f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1d1d1f; margin-bottom: 15px;">Password Reset Requested</h3>
                <p>We received a request to reset your password. Click the button below to create a new password.</p>
                <p>This link will expire in 24 hours for security purposes.</p>
                <div style="margin-top: 20px; margin-bottom: 20px; text-align: center;">
                    <a href="%s" style="background-color: #0071e3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500;">Reset Password</a>
                </div>
                <p style="color: #424245; font-size: 14px;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>`,
            resetLink)),
        ActionLink:  resetLink,
        ActionText:  "Reset Password",
        CompanyName: "Safety365 system",
    }

    return s.SendEmail(to, template.Subject, template.Message)
}

// sendLeadInvestigatorAssignedEmail sends a notification for a newly assigned lead investigator
func (s *EmailService) sendLeadInvestigatorAssignedEmail(to []string, investigation *models.Investigation, incident *models.Incident) error {
    template := &EmailTemplate{
        Subject: "You Have Been Assigned As Lead Investigator",
        Title:   "Lead Investigator Assignment",
        Message: template.HTML(fmt.Sprintf(`
            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1976d2; margin-bottom: 15px;">Lead Investigator Assignment</h3>
                <div style="background-color: white; padding: 15px; border-radius: 6px;">
                    <p><strong>Investigation Title:</strong> %s</p>
                    <p><strong>Priority:</strong> <span style="color: %s">%s</span></p>
                    <p><strong>Description:</strong> %s</p>
                    <p><strong>Start Date:</strong> %s</p>
                    <p><strong>Status:</strong> %s</p>
                    %s
                </div>
                <div style="margin-top: 15px; color: #1976d2;">
                    <p>As the Lead Investigator, you are responsible for overseeing this investigation and ensuring it is completed thoroughly and on time.</p>
                    <p><strong>Your Responsibilities:</strong></p>
                    <ul style="margin-top: 5px;">
                        <li>Review the investigation details and scope</li>
                        <li>Coordinate with team members and stakeholders</li>
                        <li>Ensure all evidence and findings are documented</li>
                        <li>Submit the final investigation report by the due date</li>
                    </ul>
                </div>
            </div>`,
            investigation.Description,
            getPriorityColor(incident.SeverityLevel),
            incident.SeverityLevel,
            investigation.Description,
            investigation.StartedAt.Format("Monday, January 2, 2006"),
            investigation.Status,
            InvestigationAdditionalContext(incident))),
        ActionLink: fmt.Sprintf("/investigations/%s", investigation.ID),
        ActionText: "View Investigation Details",
    }

    return s.SendEmail(to, template.Subject, template.Message)
}