package cbttoken

import (
	"crypto/hmac"
	"crypto/sha256"
	"fmt"
	"strings"
	"time"
)

// Allowed alphabet: uppercase alphanumeric excluding easily confusable characters (e.g. no 0, O, 1, I)
const tokenAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

// GenerateTokenForStep creates a 6-character token for a specific 60-second time slice
func GenerateTokenForStep(examID int64, secret string, timeStep int64) string {
	message := fmt.Sprintf("exam-%d-step-%d", examID, timeStep)
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(message))
	digest := h.Sum(nil)

	// Pick 6 characters from digest
	var sb strings.Builder
	for i := 0; i < 6; i++ {
		idx := int(digest[i]) % len(tokenAlphabet)
		sb.WriteByte(tokenAlphabet[idx])
	}
	return sb.String()
}

// GenerateCurrentToken returns the active 60-second token and the remaining seconds before it expires
func GenerateCurrentToken(examID int64, secret string) (string, int) {
	now := time.Now().Unix()
	step := now / 60
	secondsRemaining := 60 - int(now%60)
	if secondsRemaining == 0 {
		secondsRemaining = 60
	}
	token := GenerateTokenForStep(examID, secret, step)
	return token, secondsRemaining
}

// ValidateToken verifies if the student's input matches the current token (with +/- 1 minute drift tolerance)
func ValidateToken(examID int64, secret string, input string) bool {
	input = strings.ToUpper(strings.TrimSpace(input))
	if len(input) != 6 {
		return false
	}

	now := time.Now().Unix()
	currentStep := now / 60

	// Check current, previous (-1), and next (+1) steps for clock skew tolerance
	steps := []int64{currentStep, currentStep - 1, currentStep + 1}
	for _, s := range steps {
		if GenerateTokenForStep(examID, secret, s) == input {
			return true
		}
	}
	return false
}
