package handler

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	mw "github.com/lm102c/todo-app/backend/internal/middleware"
	"github.com/lm102c/todo-app/backend/internal/model"
	"github.com/lm102c/todo-app/backend/internal/repository"
)

type CategoryHandler struct {
	categoryRepo *repository.CategoryRepository
}

func NewCategoryHandler(categoryRepo *repository.CategoryRepository) *CategoryHandler {
	return &CategoryHandler{categoryRepo: categoryRepo}
}

type CreateCategoryRequest struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}

type UpdateCategoryRequest struct {
	Name  *string `json:"name"`
	Color *string `json:"color"`
}

func (h *CategoryHandler) List(c echo.Context) error {
	userID := mw.GetUserID(c)

	categories, err := h.categoryRepo.List(c.Request().Context(), userID)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"categories": categories,
	})
}

func (h *CategoryHandler) Create(c echo.Context) error {
	userID := mw.GetUserID(c)

	var req CreateCategoryRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": map[string]string{
				"code":    "VALIDATION_ERROR",
				"message": "リクエストの形式が正しくありません",
			},
		})
	}

	fields := make(map[string]string)
	if req.Name == "" {
		fields["name"] = "カテゴリ名は必須です"
	} else if len(req.Name) > 50 {
		fields["name"] = "カテゴリ名は50文字以内にしてください"
	}
	if req.Color != "" && !isValidHexColor(req.Color) {
		fields["color"] = "カラーはHEX形式で指定してください（例: #FF6B6B）"
	}
	if len(fields) > 0 {
		return handleError(c, model.NewValidationError(fields))
	}

	// Check duplicate
	existing, err := h.categoryRepo.GetByName(c.Request().Context(), userID, req.Name)
	if err != nil {
		return handleError(c, err)
	}
	if existing != nil {
		return handleError(c, model.NewAppError(http.StatusConflict, "CATEGORY_ALREADY_EXISTS", "同名のカテゴリが既に存在します"))
	}

	color := "#808080"
	if req.Color != "" {
		color = req.Color
	}

	cat := &model.Category{
		ID:     uuid.New(),
		UserID: userID,
		Name:   req.Name,
		Color:  color,
	}

	if err := h.categoryRepo.Create(c.Request().Context(), cat); err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"id":         cat.ID,
		"name":       cat.Name,
		"color":      cat.Color,
		"todo_count": 0,
		"created_at": cat.CreatedAt,
		"updated_at": cat.UpdatedAt,
	})
}

func (h *CategoryHandler) Get(c echo.Context) error {
	userID := mw.GetUserID(c)

	catID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": map[string]string{
				"code":    "VALIDATION_ERROR",
				"message": "IDの形式が正しくありません",
			},
		})
	}

	cat, err := h.categoryRepo.GetByID(c.Request().Context(), catID, userID)
	if err != nil {
		return handleError(c, err)
	}
	if cat == nil {
		return c.JSON(http.StatusNotFound, map[string]interface{}{
			"error": map[string]string{
				"code":    "NOT_FOUND",
				"message": "指定されたカテゴリが見つかりません",
			},
		})
	}

	return c.JSON(http.StatusOK, cat)
}

func (h *CategoryHandler) Update(c echo.Context) error {
	userID := mw.GetUserID(c)

	catID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": map[string]string{
				"code":    "VALIDATION_ERROR",
				"message": "IDの形式が正しくありません",
			},
		})
	}

	var req UpdateCategoryRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": map[string]string{
				"code":    "VALIDATION_ERROR",
				"message": "リクエストの形式が正しくありません",
			},
		})
	}

	updates := make(map[string]interface{})

	if req.Name != nil {
		if *req.Name == "" {
			return handleError(c, model.NewValidationError(map[string]string{
				"name": "カテゴリ名は必須です",
			}))
		}
		if len(*req.Name) > 50 {
			return handleError(c, model.NewValidationError(map[string]string{
				"name": "カテゴリ名は50文字以内にしてください",
			}))
		}
		// Check duplicate name
		existing, err := h.categoryRepo.GetByName(c.Request().Context(), userID, *req.Name)
		if err != nil {
			return handleError(c, err)
		}
		if existing != nil && existing.ID != catID {
			return handleError(c, model.NewAppError(http.StatusConflict, "CATEGORY_ALREADY_EXISTS", "同名のカテゴリが既に存在します"))
		}
		updates["name"] = *req.Name
	}
	if req.Color != nil {
		if !isValidHexColor(*req.Color) {
			return handleError(c, model.NewValidationError(map[string]string{
				"color": "カラーはHEX形式で指定してください（例: #FF6B6B）",
			}))
		}
		updates["color"] = *req.Color
	}

	if len(updates) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": map[string]string{
				"code":    "VALIDATION_ERROR",
				"message": "更新するフィールドを指定してください",
			},
		})
	}

	cat, err := h.categoryRepo.Update(c.Request().Context(), catID, userID, updates)
	if err != nil {
		return handleError(c, err)
	}
	if cat == nil {
		return c.JSON(http.StatusNotFound, map[string]interface{}{
			"error": map[string]string{
				"code":    "NOT_FOUND",
				"message": "指定されたカテゴリが見つかりません",
			},
		})
	}

	return c.JSON(http.StatusOK, cat)
}

func (h *CategoryHandler) Delete(c echo.Context) error {
	userID := mw.GetUserID(c)

	catID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": map[string]string{
				"code":    "VALIDATION_ERROR",
				"message": "IDの形式が正しくありません",
			},
		})
	}

	err = h.categoryRepo.Delete(c.Request().Context(), catID, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return c.JSON(http.StatusNotFound, map[string]interface{}{
				"error": map[string]string{
					"code":    "NOT_FOUND",
					"message": "指定されたカテゴリが見つかりません",
				},
			})
		}
		return handleError(c, err)
	}

	return c.NoContent(http.StatusNoContent)
}

func isValidHexColor(color string) bool {
	if !strings.HasPrefix(color, "#") {
		return false
	}
	hex := color[1:]
	if len(hex) != 6 && len(hex) != 3 {
		return false
	}
	for _, c := range hex {
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
			return false
		}
	}
	return true
}
