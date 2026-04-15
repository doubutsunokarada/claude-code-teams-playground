package middleware

import (
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/lm102c/todo-app/backend/internal/service"
)

const UserIDKey = "user_id"

func AuthMiddleware(authService *service.AuthService) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return c.JSON(http.StatusUnauthorized, map[string]interface{}{
					"error": map[string]string{
						"code":    "UNAUTHORIZED",
						"message": "認証が必要です",
					},
				})
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || parts[0] != "Bearer" {
				return c.JSON(http.StatusUnauthorized, map[string]interface{}{
					"error": map[string]string{
						"code":    "UNAUTHORIZED",
						"message": "認証が必要です",
					},
				})
			}

			userID, err := authService.ValidateAccessTokenWithContext(c.Request().Context(), parts[1])
			if err != nil {
				return c.JSON(http.StatusUnauthorized, map[string]interface{}{
					"error": map[string]string{
						"code":    "TOKEN_EXPIRED",
						"message": "トークンが無効または期限切れです",
					},
				})
			}

			c.Set(UserIDKey, userID)
			return next(c)
		}
	}
}

func GetUserID(c echo.Context) uuid.UUID {
	return c.Get(UserIDKey).(uuid.UUID)
}
