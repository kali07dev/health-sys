package services

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/smtp"
	"strings"
)

type EmailService struct {
	smtpHost     string
	smtpPort     int
	smtpUsername string
	smtpPassword string
	useTLS       bool
}

// NewEmailService creates a new EmailService instance
func NewEmailService(host string, port int, username, password string, useTLS bool) *EmailService {
	return &EmailService{
		smtpHost:     host,
		smtpPort:     port,
		smtpUsername: username,
		smtpPassword: password,
		useTLS:       useTLS,
	}
}

// SendEmail sends an email to a list of recipients
func (s *EmailService) SendEmail(to []string, subject, body string) error {
	// Validate inputs
	if len(to) == 0 {
		return fmt.Errorf("recipient list cannot be empty")
	}

	// Create authentication
	auth := smtp.PlainAuth("", s.smtpUsername, s.smtpPassword, s.smtpHost)

	// Prepare email content
	headers := make([]string, 0)
	headers = append(headers, fmt.Sprintf("From: %s", s.smtpUsername))
	headers = append(headers, fmt.Sprintf("To: %s", strings.Join(to, ", ")))
	headers = append(headers, fmt.Sprintf("Subject: %s", subject))
	headers = append(headers, "MIME-Version: 1.0")
	headers = append(headers, "Content-Type: text/plain; charset=UTF-8")
	
	emailContent := strings.Join(headers, "\r\n") + "\r\n\r\n" + body

	// Choose sending method based on TLS configuration
	s.useTLS = true

	if s.useTLS {
		return s.sendWithTLS(auth, to, []byte(emailContent))
	}
	return s.sendWithStartTLS(auth, to, []byte(emailContent))
}

// sendWithTLS sends email using TLS connection
func (s *EmailService) sendWithTLS(auth smtp.Auth, to []string, message []byte) error {
	// Set up TLS config
	tlsConfig := &tls.Config{
		ServerName: s.smtpHost,
		MinVersion: tls.VersionTLS12,
	}

	// Connect to the server
	conn, err := tls.Dial("tcp", fmt.Sprintf("%s:%d", s.smtpHost, s.smtpPort), tlsConfig)
	if err != nil {
		return fmt.Errorf("failed to establish TLS connection: %v", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, s.smtpHost)
	if err != nil {
		return fmt.Errorf("failed to create SMTP client: %v", err)
	}
	defer client.Close()

	return s.sendMail(client, auth, to, message)
}

// sendWithStartTLS sends email using STARTTLS
func (s *EmailService) sendWithStartTLS(auth smtp.Auth, to []string, message []byte) error {
	// Connect to the server
	client, err := smtp.Dial(fmt.Sprintf("%s:%d", s.smtpHost, s.smtpPort))
	if err != nil {
		return fmt.Errorf("failed to connect to SMTP server: %v", err)
	}
	defer client.Close()

	// Start TLS
	if err := client.StartTLS(&tls.Config{
		ServerName: s.smtpHost,
		MinVersion: tls.VersionTLS12,
	}); err != nil {
		return fmt.Errorf("failed to start TLS: %v", err)
	}

	return s.sendMail(client, auth, to, message)
}

// sendMail handles the common SMTP sending logic
func (s *EmailService) sendMail(client *smtp.Client, auth smtp.Auth, to []string, message []byte) error {
	// Authenticate
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

	if _, err := writer.Write(message); err != nil {
		return fmt.Errorf("failed to write message: %v", err)
	}

	log.Printf("Successfully sent email to %v", to)
	return nil
}