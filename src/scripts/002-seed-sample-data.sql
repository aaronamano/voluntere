-- Insert sample events (you'll need to replace with actual user IDs after registration)
INSERT INTO events (title, description, date, location, latitude, longitude, volunteers_needed, host_id) VALUES
(
  'Community Garden Cleanup',
  'Help us clean and maintain our local community garden. We''ll be weeding, planting, and general maintenance.',
  '2024-02-15 09:00:00+00',
  'Central Park Community Garden, New York, NY',
  40.7829,
  -73.9654,
  15,
  '00000000-0000-0000-0000-000000000000'
),
(
  'Food Bank Volunteer Day',
  'Sort and pack food donations for local families in need. No experience necessary!',
  '2024-02-20 10:00:00+00',
  'NYC Food Bank, Brooklyn, NY',
  40.6892,
  -73.9442,
  20,
  '00000000-0000-0000-0000-000000000000'
),
(
  'Beach Cleanup Initiative',
  'Join us for a morning of beach cleanup to protect our marine environment.',
  '2024-02-25 08:00:00+00',
  'Coney Island Beach, Brooklyn, NY',
  40.5755,
  -73.9707,
  25,
  '00000000-0000-0000-0000-000000000000'
);

-- Note: Replace the host_id values with actual user IDs after user registration
