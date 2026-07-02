CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    show_id UUID NOT NULL,
    seat_label VARCHAR(10) NOT NULL,
    status seat_status NOT NULL DEFAULT 'available',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_show
        FOREIGN KEY (show_id)
        REFERENCES shows(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_show_seat
        UNIQUE (show_id, seat_label)
);

CREATE INDEX idx_seats_show_status
   ON seats(show_id, status)