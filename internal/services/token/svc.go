package token

import (
	"crypto/rand"
	"encoding/base64"
	"time"
)

type TokenService struct {
	tokenExpiration time.Duration
}

func NewTokenService() *TokenService {
	return &TokenService{
		tokenExpiration: 48 * time.Hour, // Token valid for 48 hours
	}
}

func (s *TokenService) GenerateToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func (s *TokenService) GetExpirationTime() time.Time {
	return time.Now().Add(s.tokenExpiration)
}
