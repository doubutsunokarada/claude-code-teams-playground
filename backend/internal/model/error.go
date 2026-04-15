package model

import "fmt"

type AppError struct {
	Code    string            `json:"code"`
	Message string            `json:"message"`
	Fields  map[string]string `json:"fields,omitempty"`
	Status  int               `json:"-"`
}

func (e *AppError) Error() string {
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func NewAppError(status int, code, message string) *AppError {
	return &AppError{Status: status, Code: code, Message: message}
}

func NewValidationError(fields map[string]string) *AppError {
	return &AppError{
		Status:  400,
		Code:    "VALIDATION_ERROR",
		Message: "入力内容に誤りがあります",
		Fields:  fields,
	}
}
