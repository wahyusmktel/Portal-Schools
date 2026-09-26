package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"portal-smktelkom/backend/internal/models"
)

type Claims struct {
	UserID int64       `json:"userId"`
	Email  string      `json:"email"`
	Role   models.Role `json:"role"`
	jwt.RegisteredClaims
}

type TokenManager struct {
	secret []byte
	ttl    time.Duration
}

func NewTokenManager(secret string, ttl time.Duration) *TokenManager {
	return &TokenManager{secret: []byte(secret), ttl: ttl}
}

func (m *TokenManager) Issue(user models.User) (string, time.Time, error) {
	now := time.Now()
	expiresAt := now.Add(m.ttl)
	claims := Claims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.Email,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(m.secret)
	return signed, expiresAt, err
}

func (m *TokenManager) Verify(tokenValue string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenValue, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("unexpected signing method")
		}
		return m.secret, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

type StudentClaims struct {
	StudentID  int64  `json:"studentId"`
	ExamNumber string `json:"examNumber"`
	Name       string `json:"name"`
	ClassName  string `json:"className"`
	jwt.RegisteredClaims
}

func (m *TokenManager) IssueStudent(s models.CbtStudent) (string, time.Time, error) {
	now := time.Now()
	expiresAt := now.Add(24 * time.Hour) // 24 hours exam session
	claims := StudentClaims{
		StudentID:  s.ID,
		ExamNumber: s.ExamNumber,
		Name:       s.Name,
		ClassName:  s.ClassName,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   s.ExamNumber,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(m.secret)
	return signed, expiresAt, err
}

func (m *TokenManager) VerifyStudent(tokenValue string) (*StudentClaims, error) {
	token, err := jwt.ParseWithClaims(tokenValue, &StudentClaims{}, func(token *jwt.Token) (interface{}, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("unexpected signing method")
		}
		return m.secret, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*StudentClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid student token")
	}

	return claims, nil
}

