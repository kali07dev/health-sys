package services

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/smtp"
)

type EmailService struct {
	smtpHost     string
	smtpPort     int
	smtpUsername string
	smtpPassword string
}

func NewEmailService(smtpHost string, smtpPort int, smtpUsername, smtpPassword string) *EmailService {
	return &EmailService{
		smtpHost:     smtpHost,
		smtpPort:     smtpPort,
		smtpUsername: smtpUsername,
		smtpPassword: smtpPassword,
	}
}

// SendEmail sends an email to a list of recipients
func (s *EmailService) SendEmail(to []string, subject, body string) error {
	// Set up authentication
	auth := smtp.PlainAuth("", s.smtpUsername, s.smtpPassword, s.smtpHost)

	// Set up TLS config
	tlsConfig := &tls.Config{
		InsecureSkipVerify: true, // Use only for testing; remove in production
		ServerName:         s.smtpHost,
	}

	// Connect to the SMTP server
	conn, err := tls.Dial("tcp", fmt.Sprintf("%s:%d", s.smtpHost, s.smtpPort), tlsConfig)
	if err != nil {
		return fmt.Errorf("failed to connect to SMTP server: %v", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, s.smtpHost)
	if err != nil {
		return fmt.Errorf("failed to create SMTP client: %v", err)
	}
	defer client.Close()

	// Authenticate
	if err := client.Auth(auth); err != nil {
		return fmt.Errorf("failed to authenticate: %v", err)
	}

	// Set the sender
	if err := client.Mail(s.smtpUsername); err != nil {
		return fmt.Errorf("failed to set sender: %v", err)
	}

	// Set the recipients
	for _, recipient := range to {
		if err := client.Rcpt(recipient); err != nil {
			return fmt.Errorf("failed to set recipient %s: %v", recipient, err)
		}
	}

	// Send the email body
	wc, err := client.Data()
	if err != nil {
		return fmt.Errorf("failed to open data connection: %v", err)
	}
	defer wc.Close()

	emailContent := fmt.Sprintf("To: %s\r\nSubject: %s\r\n\r\n%s", to[0], subject, body)
	if _, err := wc.Write([]byte(emailContent)); err != nil {
		return fmt.Errorf("failed to write email content: %v", err)
	}

	log.Printf("Email sent to %v with subject: %s", to, subject)
	return nil
}