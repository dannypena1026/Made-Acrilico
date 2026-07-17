ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'deposit_received', 'paid', 'refunded'));
ALTER TABLE orders ADD COLUMN payment_note TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_orders_payment_status_created_at
    ON orders(payment_status, created_at DESC);
