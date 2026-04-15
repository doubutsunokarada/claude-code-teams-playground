package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/lm102c/todo-app/backend/internal/model"
)

func handleError(c echo.Context, err error) error {
	if appErr, ok := err.(*model.AppError); ok {
		resp := map[string]interface{}{
			"error": map[string]interface{}{
				"code":    appErr.Code,
				"message": appErr.Message,
			},
		}
		if appErr.Fields != nil {
			resp["error"].(map[string]interface{})["fields"] = appErr.Fields
		}
		return c.JSON(appErr.Status, resp)
	}
	return c.JSON(http.StatusInternalServerError, map[string]interface{}{
		"error": map[string]string{
			"code":    "INTERNAL_ERROR",
			"message": "サーバー内部エラーが発生しました",
		},
	})
}
