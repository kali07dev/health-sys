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
	Message     string
	ActionLink  string
	ActionText  string
	CompanyName string
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
func (s *EmailService) SendEmail(to []string, subject, body string) error {
	if len(to) == 0 {
		return fmt.Errorf("recipient list cannot be empty")
	}
	template := &EmailTemplate{
		Subject:     subject,
		Title:       subject,
		Message:     body,
		CompanyName: "Health System",
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
		Message: fmt.Sprintf(`
			<div style="background-color: #f5f5f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
				<h3 style="color: #1d1d1f; margin-bottom: 15px;">Task Details</h3>
				<p><strong>Description:</strong> %s</p>
				<p><strong>Due Date:</strong> %s</p>
				<p style="color: #424245; margin-top: 15px;">Please review and begin working on this task as soon as possible.</p>
			</div>`,
			action.Description,
			action.DueDate.Format("January 2, 2006")),
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
		Message: fmt.Sprintf(`
			<div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
				<h3 style="color: #e65100; margin-bottom: 15px;">Action Required Soon</h3>
				<p><strong>Task:</strong> %s</p>
				<p><strong>Due Date:</strong> %s</p>
				<p style="color: #424245; margin-top: 15px;">This task requires your attention. Please complete it before the deadline.</p>
			</div>`,
			action.Description,
			action.DueDate.Format("January 2, 2006")),
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
		Message: fmt.Sprintf(`
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
			interview.Location),
		ActionLink: fmt.Sprintf("/interviews/%s", interview.ID),
		ActionText: "Add to Calendar",
	}

	return s.SendEmail(to, template.Subject, template.Message)
}
