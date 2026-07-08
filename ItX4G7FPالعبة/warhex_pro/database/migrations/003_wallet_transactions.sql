CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(32) NOT NULL,
  currency VARCHAR(24) NOT NULL,
  amount_delta NUMERIC(14,2) NOT NULL,
  direction VARCHAR(12) NOT NULL,
  category VARCHAR(48) NOT NULL,
  reference_id VARCHAR(96),
  balance_after NUMERIC(14,2) NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transactions_username_created ON transactions(username, created_at DESC);

CREATE TABLE IF NOT EXISTS system_configs (
  key VARCHAR(64) PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_configs (key, value)
VALUES (
  'economy',
  jsonb_build_object(
    'giftReceiverRatio', 0.8,
    'defaultRoomFeePercent', 10,
    'roomFeePresets', jsonb_build_array(
      jsonb_build_object('currency','coins','amount',200,'winnerPayout',350,'systemFee',50),
      jsonb_build_object('currency','coins','amount',500,'winnerPayout',900,'systemFee',100),
      jsonb_build_object('currency','gems','amount',10,'winnerPayout',18,'systemFee',2)
    )
  )
)
ON CONFLICT (key) DO NOTHING;
