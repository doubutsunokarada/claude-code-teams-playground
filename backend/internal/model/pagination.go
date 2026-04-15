package model

type Pagination struct {
	Page       int `json:"page"`
	PerPage    int `json:"per_page"`
	TotalCount int `json:"total_count"`
	TotalPages int `json:"total_pages"`
}

type TodoListParams struct {
	UserID     string
	Status     string
	Priority   string
	CategoryID string
	Search     string
	Sort       string
	Order      string
	Page       int
	PerPage    int
}
