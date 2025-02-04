package utils

import (
	"log"
	"os"

	"github.com/getsentry/sentry-go"
	"github.com/sirupsen/logrus"
	"gopkg.in/natefinch/lumberjack.v2"
)

var Logger *logrus.Logger

func InitLogger(logLevel string, logFormat string, logFile string, sentryDSN string) {
	Logger = logrus.New()

	// Set log level
	switch logLevel {
	case "debug":
		Logger.SetLevel(logrus.DebugLevel)
	case "info":
		Logger.SetLevel(logrus.InfoLevel)
	case "warn":
		Logger.SetLevel(logrus.WarnLevel)
	case "error":
		Logger.SetLevel(logrus.ErrorLevel)
	case "fatal":
		Logger.SetLevel(logrus.FatalLevel)
	case "panic":
		Logger.SetLevel(logrus.PanicLevel)
	default:
		Logger.SetLevel(logrus.InfoLevel) // Default to info level
	}

	// Set log format
	switch logFormat {
	case "json":
		Logger.SetFormatter(&logrus.JSONFormatter{})
	default:
		Logger.SetFormatter(&logrus.TextFormatter{
			FullTimestamp: true,
		})
	}

	// Set log output
	if logFile != "" {
		log.Println("reading log file!", logFile)
		// Use lumberjack for log rotation
		Logger.SetOutput(&lumberjack.Logger{
			Filename:   logFile, // Log file path
			MaxSize:    100,     // Max size in MB before rotation
			MaxBackups: 3,       // Max number of old log files to retain
			MaxAge:     28,      // Max number of days to retain log files
			Compress:   true,    // Compress rotated log files
		})
		log.Println("done log file!")
	} else {
		// Default to stdout
		Logger.SetOutput(os.Stdout)
	}

	// Initialize Sentry
	if sentryDSN != "" {
		log.Println("Sentry!", sentryDSN)

		err := sentry.Init(sentry.ClientOptions{
			Dsn: sentryDSN,
		})
		log.Println("senetery 2222!", err)

		if err != nil {
			Logger.Fatalf("Failed to initialize Sentry: %v", err)
		}
		log.Println("done 2222!")
	}
}

// LogError logs an error message and sends it to Sentry
func LogError(message string, fields map[string]interface{}) {
	Logger.WithFields(fields).Error(message)

	// Send error to Sentry
	if sentry.CurrentHub().Client() != nil {
		sentry.WithScope(func(scope *sentry.Scope) {
			for key, value := range fields {
				scope.SetExtra(key, value)
			}
			sentry.CaptureMessage(message)
		})
	}
}

// LogFatal logs a fatal message, sends it to Sentry, and exits the program
func LogFatal(message string, fields map[string]interface{}) {
	Logger.WithFields(fields).Fatal(message)

	// Send fatal error to Sentry
	if sentry.CurrentHub().Client() != nil {
		sentry.WithScope(func(scope *sentry.Scope) {
			for key, value := range fields {
				scope.SetExtra(key, value)
			}
			sentry.CaptureMessage(message)
		})
	}
	os.Exit(1)
}

// LogDebug logs a debug message
func LogDebug(message string, fields map[string]interface{}) {
	Logger.WithFields(fields).Debug(message)
}

// LogInfo logs an info message
func LogInfo(message string, fields map[string]interface{}) {
	Logger.WithFields(fields).Info(message)
}

// LogWarn logs a warning message
func LogWarn(message string, fields map[string]interface{}) {
	Logger.WithFields(fields).Warn(message)
}

// LogPanic logs a panic message and panics
func LogPanic(message string, fields map[string]interface{}) {
	Logger.WithFields(fields).Panic(message)
}
