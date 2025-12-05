-- Add foreign key from payment_receipts to subscription_invoices
ALTER TABLE payment_receipts
ADD CONSTRAINT payment_receipts_invoice_id_fkey 
FOREIGN KEY (invoice_id) 
REFERENCES subscription_invoices(id) 
ON DELETE CASCADE;