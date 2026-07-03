DO $$
BEGIN
    CREATE TYPE payment_status AS ENUM (
        'pending',
        'completed',
        'failed'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE booking_status AS ENUM (
        'confirmed',
        'cancelled',
        'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE bookings(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    show_id UUID NOT NULL,
    payment_status payment_status NOT NULL DEFAULT 'pending',
    booking_status booking_status NOT NULL DEFAULT 'confirmed',
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_booking_show
    FOREIGN KEY (show_id)
    REFERENCES shows(id)
);