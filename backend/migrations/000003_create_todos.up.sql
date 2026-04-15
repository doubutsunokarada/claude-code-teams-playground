CREATE TYPE todo_status AS ENUM ('pending', 'in_progress', 'done');
CREATE TYPE todo_priority AS ENUM ('low', 'medium', 'high');

CREATE TABLE todos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status todo_status NOT NULL DEFAULT 'pending',
    priority todo_priority NOT NULL DEFAULT 'medium',
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_todos_user_id ON todos (user_id);
CREATE INDEX idx_todos_user_status ON todos (user_id, status);
CREATE INDEX idx_todos_user_priority ON todos (user_id, priority);
CREATE INDEX idx_todos_user_due_date ON todos (user_id, due_date);
CREATE INDEX idx_todos_category_id ON todos (category_id);
