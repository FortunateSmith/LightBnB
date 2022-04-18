SELECT reservations.id, properties.title, start_date, properties.cost_per_night, AVG(rating)
FROM reservations
JOIN properties ON properties.id = property_id
JOIN property_reviews ON reservations.id = reservation_id
JOIN users ON users.id = reservations.guest_id
WHERE reservations.guest_id = 1
GROUP BY reservations.id, properties.title, properties.cost_per_night
ORDER BY start_date DESC
LIMIT 10;