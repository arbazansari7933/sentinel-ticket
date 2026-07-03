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
        'CONFIRMED',
        'CANCELLED',
        'EXPIRED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;