CREATE TABLE account_period_balances (
  account_id INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  opening_balance NUMERIC DEFAULT 0,
  closing_balance NUMERIC DEFAULT 0,
  PRIMARY KEY (account_id, period_start)
);

CREATE OR REPLACE FUNCTION update_balances_forward(
  p_account_id INTEGER,
  p_entry_date DATE,
  p_debit NUMERIC,
  p_credit NUMERIC
) RETURNS VOID AS
$$
DECLARE
  r RECORD;
  affected_period_start DATE;
  affected_period_end DATE;
  balance_change NUMERIC;
  previous_balance NUMERIC;
BEGIN
  -- 1. Get the affected period start
  SELECT period_start, period_end INTO affected_period_start, affected_period_end
  FROM account_period_balances
  WHERE account_id = p_account_id
    AND p_entry_date BETWEEN period_start AND period_end
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No balance period found for account % and date %', p_account_id, p_entry_date;
  END IF;

  -- 2. Update the affected period's debit/credit
  UPDATE account_period_balances
  SET
    debit = debit + p_debit,
    credit = credit + p_credit
  WHERE account_id = p_account_id
    AND period_start = affected_period_start;

  -- 3. Recalculate closing balance for affected period
  SELECT opening_balance + (debit + p_debit) - (credit + p_credit)
  INTO previous_balance
  FROM account_period_balances
  WHERE account_id = p_account_id
    AND period_start = affected_period_start;

  UPDATE account_period_balances
  SET closing_balance = previous_balance
  WHERE account_id = p_account_id
    AND period_start = affected_period_start;

  -- 4. Propagate to all future periods
  FOR r IN
    SELECT period_start, debit, credit
    FROM account_period_balances
    WHERE account_id = p_account_id
      AND period_start > affected_period_start
    ORDER BY period_start
  LOOP
    UPDATE account_period_balances
    SET
      opening_balance = previous_balance,
      closing_balance = previous_balance + debit - credit
    WHERE account_id = p_account_id
      AND period_start = r.period_start;

    -- Set new balance for next iteration
    previous_balance := previous_balance + r.debit - r.credit;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

