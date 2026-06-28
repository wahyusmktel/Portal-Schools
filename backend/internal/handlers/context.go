package handlers

import (
	"context"
	"net/http"

	"portal-smktelkom/backend/internal/auth"
)

type contextKey string

const claimsContextKey contextKey = "claims"

func withClaims(r *http.Request, claims *auth.Claims) *http.Request {
	ctx := context.WithValue(r.Context(), claimsContextKey, claims)
	return r.WithContext(ctx)
}

func claimsFromRequest(r *http.Request) (*auth.Claims, bool) {
	claims, ok := r.Context().Value(claimsContextKey).(*auth.Claims)
	return claims, ok
}
