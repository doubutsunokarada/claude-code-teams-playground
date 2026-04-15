package handler

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"

	mw "github.com/lm102c/todo-app/backend/internal/middleware"
	"github.com/lm102c/todo-app/backend/internal/service"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Register(c echo.Context) error {
	var req service.RegisterRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": map[string]string{
				"code":    "VALIDATION_ERROR",
				"message": "リクエストの形式が正しくありません",
			},
		})
	}

	user, tokens, err := h.authService.Register(c.Request().Context(), req)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"user": map[string]interface{}{
			"id":         user.ID,
			"email":      user.Email,
			"name":       user.Name,
			"created_at": user.CreatedAt,
		},
		"access_token":  tokens.AccessToken,
		"refresh_token": tokens.RefreshToken,
	})
}

func (h *AuthHandler) Login(c echo.Context) error {
	var req service.LoginRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": map[string]string{
				"code":    "VALIDATION_ERROR",
				"message": "リクエストの形式が正しくありません",
			},
		})
	}

	user, tokens, err := h.authService.Login(c.Request().Context(), req)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"user": map[string]interface{}{
			"id":         user.ID,
			"email":      user.Email,
			"name":       user.Name,
			"created_at": user.CreatedAt,
		},
		"access_token":  tokens.AccessToken,
		"refresh_token": tokens.RefreshToken,
	})
}

func (h *AuthHandler) Refresh(c echo.Context) error {
	var req service.RefreshRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": map[string]string{
				"code":    "VALIDATION_ERROR",
				"message": "リクエストの形式が正しくありません",
			},
		})
	}

	tokens, err := h.authService.Refresh(c.Request().Context(), req)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusOK, tokens)
}

func (h *AuthHandler) Logout(c echo.Context) error {
	userID := mw.GetUserID(c)

	authHeader := c.Request().Header.Get("Authorization")
	token := strings.TrimPrefix(authHeader, "Bearer ")

	if err := h.authService.Logout(c.Request().Context(), token, userID); err != nil {
		return handleError(c, err)
	}

	return c.NoContent(http.StatusNoContent)
}
