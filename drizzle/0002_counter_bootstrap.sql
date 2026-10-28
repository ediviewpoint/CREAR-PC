-- Preserve existing numbering when adopting the new transactional counter.
INSERT INTO proforma_counters (year, next_val)
SELECT substring(code from 5 for 4)::smallint,
       max(substring(code from 10 for 5)::integer) + 1
FROM proformas
WHERE code ~ '^PRO-[0-9]{4}-[0-9]{5}$'
GROUP BY substring(code from 5 for 4)::smallint
ON CONFLICT (year) DO UPDATE
SET next_val = greatest(proforma_counters.next_val, excluded.next_val);
