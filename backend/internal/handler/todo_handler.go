package handler

import (
	"database/sql"
	"errors"
	"math"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	mw "github.com/lm102c/todo-app/backend/internal/middleware"
	"github.com/lm102c/todo-app/backend/internal/model"
	"github.com/lm102c/todo-app/backend/internal/repository"
)

type TodoHandler struct {
	todoRepo *repository.TodoRepository
}

func NewTodoHandler(todoRepo *repository.TodoRepository) *TodoHandler {
	return &TodoHandler{todoRepo: todoRepo}
}

type CreateTodoRequest struct {
	Title       string  `json:"title"`
	Description *string `json:"description"`
	Status      string  `json:"status"`
	Priority    string  `json:"priority"`
	DueDate     *string `json:"due_date"`
	CategoryID  *string `json:"category_id"`
}

type UpdateTodoRequest struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	Status      *string `json:"status"`
	Priority    *string `json:"priority"`
	DueDate     *string `json:"due_date"`
	CategoryID  *string `json:"category_id"`
}

func (h *TodoHandler) List(c echo.Context) error {
	userID := mw.GetUserID(c)

	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page < 1 {
		page = 1
	}
	perPage, _ := strconv.Atoi(c.QueryParam("per_page"))
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	params := model.TodoListParams{
		UserID:     userID.String(),
		Status:     c.QueryParam("status"),
		Priority:   c.QueryParam("priority"),
		CategoryID: c.QueryParam("category_id"),
		Search:     c.QueryParam("search"),
		Sort:       c.QueryParam("sort"),
		Order:      c.QueryParam("order"),
		Page:       page,
		PerPage:    perPage,
	}

	result, err := h.todoRepo.List(c.Request().Context(), params)
	if err != nil {
		return handleError(c, err)
	}

	totalPages := int(math.Ceil(float64(result.TotalCount) / float64(perPage)))

	return c.JSON(http.StatusOK, map[string]interface{}{
		"todos": result.Todos,
		"pagination": model.Pagination{
			Page:       page,
			PerPage:    perPage,
			TotalCount: result.TotalCount,
			TotalPages: totalPages,
		},
	})
}

func (h *TodoHandler) Create(c echo.Context) error {
	userID := mw.GetUserID(c)

	var req CreateTodoRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": map[string]string{
				"code":    "VALIDATION_ERROR",
				"message": "リクエストの形式が正しくありません",
			},
		})
	}

	fields := make(map[string]string)
	if req.Title == "" {
		fields["title"] = "タイトルは必須です"
	} else if len(req.Title) > 200 {
		fields["title"] = "タイトルは200文字以内にしてください"
	}
	if len(fields) > 0 {
		return handleError(c, model.NewValidationError(fields))
	}

	status := model.TodoStatusPending
	if req.Status != "" {
		switch model.TodoStatus(req.Status) {
		case model.TodoStatusPending, model.TodoStatusInProgress, model.TodoStatusDone:
			status = model.TodoStatus(req.Status)
		default:
			return handleError(c, model.NewValidationError(map[string]string{
				"status": "statusはpending, in_progress, doneのいずれかを指定してください",
			}))
		}
	}

	priority := model.TodoPriorityMedium
	if req.Priority != "" {
		switch model.TodoPriority(req.Priority) {
		case model.TodoPriorityLow, model.TodoPriorityMedium, model.TodoPriorityHigh:
			priority = model.TodoPriority(req.Priority)
		default:
			return handleError(c, model.NewValidationError(map[string]string{
				"priority": "priorityはlow, medium, highのいずれかを指定してください",
			}))
		}
	}

	todo := &model.Todo{
		ID:          uuid.New(),
		UserID:      userID,
		Title:       req.Title,
		Description: req.Description,
		Status:      status,
		Priority:    priority,
		DueDate:     req.DueDate,
	}

	if req.CategoryID != nil && *req.CategoryID != "" {
		catID, err := uuid.Parse(*req.CategoryID)
		if err != nil {
			return handleError(c, model.NewValidationError(map[string]string{
				"category_id": "カテゴリIDの形式が正しくありません",
			}))
		}
		todo.CategoryID = &catID
	}

	if err := h.todoRepo.Create(c.Request().Context(), todo); err != nil {
		return handleError(c, err)
	}

	result, err := h.todoRepo.GetWithCategory(c.Request().Context(), todo.ID, userID)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusCreated, result)
}

func (h *TodoHandler) Get(c echo.Context) error {
	userID := mw.GetUserID(c)

	todoID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": map[string]string{
				"code":    "VALIDATION_ERROR",
				"message": "IDの形式が正しくありません",
			},
		})
	}

	result, err := h.todoRepo.GetWithCategory(c.Request().Context(), todoID, userID)
	if err != nil {
		return handleError(c, err)
	}
	if result == nil {
		return c.JSON(http.StatusNotFound, map[string]interface{}{
			"error": map[string]string{
				"code":    "TODO_NOT_FOUND",
				"message": "指定されたTODOが見つかりません",
			},
		})
	}

	return c.JSON(http.StatusOK, result)
}

func (h *TodoHandler) Update(c echo.Context) error {
	userID := mw.GetUserID(c)

	todoID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": map[string]string{
				"code":    "VALIDATION_ERROR",
				"message": "IDの形式が正しくありません",
			},
		})
	}

	var req UpdateTodoRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": map[string]string{
				"code":    "VALIDATION_ERROR",
				"message": "リクエストの形式が正しくありません",
			},
		})
	}

	updates := make(map[string]interface{})

	if req.Title != nil {
		if *req.Title == "" {
			return handleError(c, model.NewValidationError(map[string]string{
				"title": "タイトルは必須です",
			}))
		}
		if len(*req.Title) > 200 {
			return handleError(c, model.NewValidationError(map[string]string{
				"title": "タイトルは200文字以内にしてください",
			}))
		}
		updates["title"] = *req.Title
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Status != nil {
		switch model.TodoStatus(*req.Status) {
		case model.TodoStatusPending, model.TodoStatusInProgress, model.TodoStatusDone:
			updates["status"] = *req.Status
		default:
			return handleError(c, model.NewValidationError(map[string]string{
				"status": "statusはpending, in_progress, doneのいずれかを指定してください",
			}))
		}
	}
	if req.Priority != nil {
		switch model.TodoPriority(*req.Priority) {
		case model.TodoPriorityLow, model.TodoPriorityMedium, model.TodoPriorityHigh:
			updates["priority"] = *req.Priority
		default:
			return handleError(c, model.NewValidationError(map[string]string{
				"priority": "priorityはlow, medium, highのいずれかを指定してください",
			}))
		}
	}
	if req.DueDate != nil {
		updates["due_date"] = *req.DueDate
	}
	if req.CategoryID != nil {
		if *req.CategoryID == "" {
			updates["category_id"] = nil
		} else {
			catID, err := uuid.Parse(*req.CategoryID)
			if err != nil {
				return handleError(c, model.NewValidationError(map[string]string{
					"category_id": "カテゴリIDの形式が正しくありません",
				}))
			}
			updates["category_id"] = catID
		}
	}

	if len(updates) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": map[string]string{
				"code":    "VALIDATION_ERROR",
				"message": "更新するフィールドを指定してください",
			},
		})
	}

	todo, err := h.todoRepo.Update(c.Request().Context(), todoID, userID, updates)
	if err != nil {
		return handleError(c, err)
	}
	if todo == nil {
		return c.JSON(http.StatusNotFound, map[string]interface{}{
			"error": map[string]string{
				"code":    "TODO_NOT_FOUND",
				"message": "指定されたTODOが見つかりません",
			},
		})
	}

	result, _ := h.todoRepo.GetWithCategory(c.Request().Context(), todoID, userID)
	return c.JSON(http.StatusOK, result)
}

func (h *TodoHandler) Delete(c echo.Context) error {
	userID := mw.GetUserID(c)

	todoID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": map[string]string{
				"code":    "VALIDATION_ERROR",
				"message": "IDの形式が正しくありません",
			},
		})
	}

	err = h.todoRepo.Delete(c.Request().Context(), todoID, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return c.JSON(http.StatusNotFound, map[string]interface{}{
				"error": map[string]string{
					"code":    "TODO_NOT_FOUND",
					"message": "指定されたTODOが見つかりません",
				},
			})
		}
		return handleError(c, err)
	}

	return c.NoContent(http.StatusNoContent)
}
