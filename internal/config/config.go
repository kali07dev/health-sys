package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v2"
)

type Config struct {
	Database struct {
		Host     string `yaml:"host"`
		Port     int    `yaml:"port"`
		User     string `yaml:"user"`
		Password string `yaml:"password"`
		DBName   string `yaml:"dbname"`
		SSLMode  string `yaml:"sslmode"`
	} `yaml:"database"`
	Logging struct {
		Level  string `yaml:"level"`
		Format string `yaml:"format"`
		File   string `yaml:"file"`
	} `yaml:"logging"`
	SMTP struct {
		Host     string `yaml:"host"`
		Port     int    `yaml:"port"`
		Username string `yaml:"username"`
		Password string `yaml:"password"`
		UseTLS bool `yaml:"use_tls"`
	} `yaml:"smtp"`
	Sentry struct {
		DSN string `yaml:"dsn"`
	} `yaml:"sentry"`
	CORS struct {
		AllowedOrigins   string `yaml:"allowed_origins"`
		AllowCredentials bool   `yaml:"allow_credentials"`
		AllowedHeaders   string `yaml:"allowed_headers"`
		AllowedMethods   string `yaml:"allowed_methods"`
	} `yaml:"cors"`
}

func LoadConfig(path string) (*Config, error) {
	config := &Config{}
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("error reading path: %w", err)
	}
	defer file.Close()

	if err := yaml.NewDecoder(file).Decode(config); err != nil {
		return nil, fmt.Errorf("error decoding path: %w", err)
	}

	return config, nil
}
