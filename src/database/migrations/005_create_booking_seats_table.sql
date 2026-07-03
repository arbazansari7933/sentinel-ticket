CREATE TABLE booking_seats(
    booking_id UUID NOT NULL,
    seat_id UUID NOT NULL,
    seat_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_booking_seats
    PRIMARY KEY(booking_id, seat_id),

    CONSTRAINT fk_booking
    FOREIGN KEY (booking_id)
    REFERENCES bookings(id),

    CONSTRAINT fk_seat
    FOREIGN KEY (seat_id)
    REFERENCES seats(id)
);