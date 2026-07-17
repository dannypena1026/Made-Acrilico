CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL CHECK (status IN ('pending_review', 'pending_notification', 'in_review', 'approved', 'in_production', 'ready', 'completed', 'cancelled')),
    email_status TEXT NOT NULL CHECK (email_status IN ('pending', 'sent', 'failed')),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    fulfillment TEXT NOT NULL CHECK (fulfillment IN ('pickup', 'shipping')),
    customer_address TEXT NOT NULL DEFAULT '',
    customer_notes TEXT NOT NULL DEFAULT '',
    subtotal_dop INTEGER NOT NULL CHECK (subtotal_dop >= 0),
    items_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    detail TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id, created_at DESC);
