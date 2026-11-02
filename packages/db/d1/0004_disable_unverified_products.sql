-- COD checkout stays gated off until an operator verifies live price and stock.
-- Product rows remain available to the public catalogue, but cannot be ordered.
UPDATE commerce_products
SET enabled = 0,
    updated_at = unixepoch()
WHERE enabled <> 0;
