-- Change quantity column from INTEGER to REAL to support decimal values
ALTER TABLE grocery_items ALTER COLUMN quantity TYPE REAL;
