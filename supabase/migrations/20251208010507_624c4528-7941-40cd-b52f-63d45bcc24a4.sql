
-- Regenerate payment schedule for PRIMA1204 contract
DO $$
BEGIN
  PERFORM generate_payment_schedule_items('564c4d46-7787-4cc3-b111-0abd0d86a73f'::uuid);
END $$;
