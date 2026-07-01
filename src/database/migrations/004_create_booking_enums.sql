CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'SUCCESS',
    'FAILED',
    'REFUNDED'
);

CREATE TYPE booking_status AS ENUM (
    'CONFIRMED',
    'CANCELLED',
    'EXPIRED'
);