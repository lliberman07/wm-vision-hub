-- Add reimbursement fields to pms_expenses table
ALTER TABLE pms_expenses
ADD COLUMN IF NOT EXISTS is_reimbursable boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reimbursement_status text DEFAULT 'pending' CHECK (reimbursement_status IN ('pending', 'included_in_schedule', 'paid')),
ADD COLUMN IF NOT EXISTS schedule_item_id uuid REFERENCES pms_payment_schedule_items(id) ON DELETE SET NULL;

-- Add comment to explain the fields
COMMENT ON COLUMN pms_expenses.is_reimbursable IS 'Indicates if this expense should be reimbursed by the tenant';
COMMENT ON COLUMN pms_expenses.reimbursement_status IS 'Status of the reimbursement: pending, included_in_schedule, paid';
COMMENT ON COLUMN pms_expenses.schedule_item_id IS 'Link to the payment schedule item created for this reimbursement';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_pms_expenses_reimbursable ON pms_expenses(is_reimbursable, reimbursement_status) WHERE is_reimbursable = true;