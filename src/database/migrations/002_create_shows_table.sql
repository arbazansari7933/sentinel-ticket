CREATE TABLE shows(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_name VARCHAR(255) NOT NULL,
    hall_name VARCHAR(255) NOT NULL,
    ticket_price DECIMAL(10,2) NOT NULL,
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);