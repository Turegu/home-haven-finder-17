-- Normalize property_type and furniture to lowercase for consistency
UPDATE properties SET property_type = lower(property_type) WHERE property_type != lower(property_type);
UPDATE properties SET furniture = lower(furniture) WHERE furniture IS NOT NULL AND furniture != lower(furniture);