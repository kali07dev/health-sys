package services

import (
	"crypto/tls"
	"fmt"
	"log"
	"net"
	"net/smtp"
	"strings"
	"time"
)

type EmailService struct {
	smtpHost     string
	smtpPort     int
	smtpUsername string
	smtpPassword string
	useTLS       bool
	timeout      time.Duration
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

	// Create email content
	headers := make([]string, 0)
	headers = append(headers, fmt.Sprintf("From: %s", s.smtpUsername))
	headers = append(headers, fmt.Sprintf("To: %s", strings.Join(to, ", ")))
	headers = append(headers, fmt.Sprintf("Subject: %s", subject))
	headers = append(headers, "MIME-Version: 1.0")
	headers = append(headers, "Content-Type: text/plain; charset=UTF-8")
	
	emailContent := strings.Join(headers, "\r\n") + "\r\n\r\n" + body

	// Set up dialer with timeout
	dialer := &net.Dialer{
		Timeout: s.timeout,
	}

	addr := fmt.Sprintf("%s:%d", s.smtpHost, s.smtpPort)

	var client *smtp.Client
	var err error

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