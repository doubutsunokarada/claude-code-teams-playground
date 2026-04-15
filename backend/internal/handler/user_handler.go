package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"

	mw "github.com/lm102c/todo-app/backend/internal/middleware"
	"github.com/lm102c/todo-app/backend/internal/repository"
)

type UserHandler struct {
	userRepo *repository.UserRepository
}

func NewUserHandler(userRepo *repository.UserRepository) *UserHandler {
	return &UserHandler{userRepo: userRepo}
}

func (h *UserHandler) GetMe(c echo.Context) error {
	userID := mw.GetUserID(c)

	user, err := h.userRepo.GetByID(c.Request().Context(), userID)
	if err != nil {
		return handleError(c, err)
	}
	if user == nil {
		return c.JSON(http.StatusNotFound, map[string]interface{}{
			"error": map[string]string{
				"code":    "NOT_FOUND",
				"message": "ユーザーが見つかりません",
			},
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":         user.ID,
		"email":      user.Email,
		"name":       user.Name,
		"created_at": user.CreatedAt,
		"updated_at": user.UpdatedAt,
	})
}

type UpdateUserRequest struct {
	Name string `json:"name"`
}

func (h *UserHandler) UpdateMe(c echo.Context) error {
	userID := mw.GetUserID(c)

	var req UpdateUserRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": map[string]string{
				"code":    "VALIDATION_ERROR",
				"message": "リクエストの形式が正しくありません",
			},
		})
	}

	if req.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": map[string]interface{}{
				"code":    "VALIDATION_ERROR",
				"message": "入力内容に誤りがあります",
				"fields":  map[string]string{"name": "名前は必須です"},
			},
		})
	}

	user, err := h.userRepo.Update(c.Request().Context(), userID, req.Name)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":         user.ID,
		"email":      user.Email,
		"name":       user.Name,
		"created_at": user.CreatedAt,
		"updated_at": user.UpdatedAt,
	})
}
