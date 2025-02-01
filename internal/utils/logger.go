package utils

import (
	"os"
	"github.com/sirupsen/logrus"
)

var Logger *logrus.Logger

func InitLogger(logLevel string, logFormat string) {
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

	// Set output to stdout
	Logger.SetOutput(os.Stdout)
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

// LogError logs an error message
func LogError(message string, fields map[string]interface{}) {
	Logger.WithFields(fields).Error(message)
}

// LogFatal logs a fatal message and exits the program
func LogFatal(message string, fields map[string]interface{}) {
	Logger.WithFields(fields).Fatal(message)
}

// LogPanic logs a panic message and panics
func LogPanic(message string, fields map[string]interface{}) {
	Logger.WithFields(fields).Panic(message)
}