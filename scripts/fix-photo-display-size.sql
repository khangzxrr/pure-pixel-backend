-- Photos uploaded before the display-size fix stored the sensor size sharp reports, not the size
-- the photo is shown at: an exif orientation that turns the photo a quarter swaps width and height.
-- The grid then lays the photo out in a box of the wrong shape and crops it (object-cover).
-- Run once against the purepixel database:
--   docker exec -i postgres psql -U postgres -d purepixel -v ON_ERROR_STOP=1 -f - < scripts/fix-photo-display-size.sql
--
-- Photos uploaded through a booking keep no exif ("exif": {}), so their size cannot be corrected here.

BEGIN;

-- what is about to change
SELECT id, title, width, height, exif ->> 'Orientation' AS orientation
FROM "Photo"
WHERE exif ->> 'Orientation' IN (
    'Rotate 90 CW',
    'Rotate 270 CW',
    'Mirror horizontal and rotate 90 CW',
    'Mirror horizontal and rotate 270 CW'
  )
ORDER BY "createdAt";

UPDATE "Photo"
SET width = height,
    height = width
WHERE exif ->> 'Orientation' IN (
    'Rotate 90 CW',
    'Rotate 270 CW',
    'Mirror horizontal and rotate 90 CW',
    'Mirror horizontal and rotate 270 CW'
  );

COMMIT;
