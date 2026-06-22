
ALTER TABLE menu_items
  ADD COLUMN is_vegetarian  boolean NOT NULL DEFAULT false,
  ADD COLUMN is_vegan       boolean NOT NULL DEFAULT false,
  ADD COLUMN is_halal       boolean NOT NULL DEFAULT false,
  ADD COLUMN is_gluten_free boolean NOT NULL DEFAULT false,
  ADD COLUMN spice_level    smallint NOT NULL DEFAULT 0
    CONSTRAINT spice_level_range CHECK (spice_level BETWEEN 0 AND 3);

COMMENT ON COLUMN menu_items.spice_level IS '0=non épicé, 1=légèrement épicé, 2=épicé, 3=très épicé';
