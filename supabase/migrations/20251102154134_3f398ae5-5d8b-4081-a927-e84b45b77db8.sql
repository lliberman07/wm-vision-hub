-- Restaurar 12 schedule items pagados (Ago-Sep-Oct 2025)
DELETE FROM pms_payment_schedule_items WHERE contract_id='c7986757-cf43-442e-88d0-1f12ef085de2' AND period_date BETWEEN '2025-08-01' AND '2025-10-31';

-- AGOSTO (4 items) - UUIDs: e3e05086, 69012dd0, e73b8bb8, b13e1af6
INSERT INTO pms_payment_schedule_items (id,tenant_id,contract_id,projection_id,owner_id,payment_method_id,period_date,item,owner_percentage,expected_amount,accumulated_paid_amount,status,created_at)
SELECT 'e3e05086-8977-4c43-8d53-dc2dbec7906b'::uuid,'8c5b46df-6090-4383-8995-a201ce7e5f9e'::uuid,'c7986757-cf43-442e-88d0-1f12ef085de2'::uuid,proj.id,'fefb4f5d-fa10-4666-b1f2-e07bc14ff4dd'::uuid,pm.id,'2025-08-01'::date,'A',60,200000,200000,'paid',now()
FROM pms_contract_monthly_projections proj JOIN pms_contract_payment_methods pm ON pm.contract_id=proj.contract_id
WHERE proj.contract_id='c7986757-cf43-442e-88d0-1f12ef085de2' AND proj.period_date='2025-08-01' AND proj.item='A' AND pm.item='A' AND pm.percentage=60 LIMIT 1;

INSERT INTO pms_payment_schedule_items (id,tenant_id,contract_id,projection_id,owner_id,payment_method_id,period_date,item,owner_percentage,expected_amount,accumulated_paid_amount,status,created_at)
SELECT '69012dd0-8f8d-483c-9eaa-29e2de434a9b'::uuid,'8c5b46df-6090-4383-8995-a201ce7e5f9e'::uuid,'c7986757-cf43-442e-88d0-1f12ef085de2'::uuid,proj.id,'a6049676-4d22-4ef5-b67f-4a9ae78f9ab0'::uuid,pm.id,'2025-08-01'::date,'A',40,200000,200000,'paid',now()
FROM pms_contract_monthly_projections proj JOIN pms_contract_payment_methods pm ON pm.contract_id=proj.contract_id
WHERE proj.contract_id='c7986757-cf43-442e-88d0-1f12ef085de2' AND proj.period_date='2025-08-01' AND proj.item='A' AND pm.item='A' AND pm.percentage=40 LIMIT 1;

INSERT INTO pms_payment_schedule_items (id,tenant_id,contract_id,projection_id,owner_id,payment_method_id,period_date,item,owner_percentage,expected_amount,accumulated_paid_amount,status,created_at)
SELECT 'e73b8bb8-f98a-4585-adbc-3397f388b8d7'::uuid,'8c5b46df-6090-4383-8995-a201ce7e5f9e'::uuid,'c7986757-cf43-442e-88d0-1f12ef085de2'::uuid,proj.id,'fefb4f5d-fa10-4666-b1f2-e07bc14ff4dd'::uuid,pm.id,'2025-08-01'::date,'B',60,120000,120000,'paid',now()
FROM pms_contract_monthly_projections proj JOIN pms_contract_payment_methods pm ON pm.contract_id=proj.contract_id
WHERE proj.contract_id='c7986757-cf43-442e-88d0-1f12ef085de2' AND proj.period_date='2025-08-01' AND proj.item='B' AND pm.item='B' AND pm.percentage=60 LIMIT 1;

INSERT INTO pms_payment_schedule_items (id,tenant_id,contract_id,projection_id,owner_id,payment_method_id,period_date,item,owner_percentage,expected_amount,accumulated_paid_amount,status,created_at)
SELECT 'b13e1af6-badc-499e-b9e9-ad585e7c5d67'::uuid,'8c5b46df-6090-4383-8995-a201ce7e5f9e'::uuid,'c7986757-cf43-442e-88d0-1f12ef085de2'::uuid,proj.id,'a6049676-4d22-4ef5-b67f-4a9ae78f9ab0'::uuid,pm.id,'2025-08-01'::date,'B',40,80000,80000,'paid',now()
FROM pms_contract_monthly_projections proj JOIN pms_contract_payment_methods pm ON pm.contract_id=proj.contract_id
WHERE proj.contract_id='c7986757-cf43-442e-88d0-1f12ef085de2' AND proj.period_date='2025-08-01' AND proj.item='B' AND pm.item='B' AND pm.percentage=40 LIMIT 1;

-- SEPTIEMBRE (4 items) - UUIDs: 82039441, 7681a2da, 36abf2fa, 8f9c424e
INSERT INTO pms_payment_schedule_items (id,tenant_id,contract_id,projection_id,owner_id,payment_method_id,period_date,item,owner_percentage,expected_amount,accumulated_paid_amount,status,created_at)
SELECT '82039441-acc5-4d6e-a460-517e242edb66'::uuid,'8c5b46df-6090-4383-8995-a201ce7e5f9e'::uuid,'c7986757-cf43-442e-88d0-1f12ef085de2'::uuid,proj.id,'fefb4f5d-fa10-4666-b1f2-e07bc14ff4dd'::uuid,pm.id,'2025-09-01'::date,'A',60,300000,300000,'paid',now()
FROM pms_contract_monthly_projections proj JOIN pms_contract_payment_methods pm ON pm.contract_id=proj.contract_id
WHERE proj.contract_id='c7986757-cf43-442e-88d0-1f12ef085de2' AND proj.period_date='2025-09-01' AND proj.item='A' AND pm.item='A' AND pm.percentage=60 LIMIT 1;

INSERT INTO pms_payment_schedule_items (id,tenant_id,contract_id,projection_id,owner_id,payment_method_id,period_date,item,owner_percentage,expected_amount,accumulated_paid_amount,status,created_at)
SELECT '7681a2da-6784-4058-bd48-1aa1c466a402'::uuid,'8c5b46df-6090-4383-8995-a201ce7e5f9e'::uuid,'c7986757-cf43-442e-88d0-1f12ef085de2'::uuid,proj.id,'a6049676-4d22-4ef5-b67f-4a9ae78f9ab0'::uuid,pm.id,'2025-09-01'::date,'A',40,200000,200000,'paid',now()
FROM pms_contract_monthly_projections proj JOIN pms_contract_payment_methods pm ON pm.contract_id=proj.contract_id
WHERE proj.contract_id='c7986757-cf43-442e-88d0-1f12ef085de2' AND proj.period_date='2025-09-01' AND proj.item='A' AND pm.item='A' AND pm.percentage=40 LIMIT 1;

INSERT INTO pms_payment_schedule_items (id,tenant_id,contract_id,projection_id,owner_id,payment_method_id,period_date,item,owner_percentage,expected_amount,accumulated_paid_amount,status,created_at)
SELECT '36abf2fa-f6dc-4435-9151-468f89419e07'::uuid,'8c5b46df-6090-4383-8995-a201ce7e5f9e'::uuid,'c7986757-cf43-442e-88d0-1f12ef085de2'::uuid,proj.id,'fefb4f5d-fa10-4666-b1f2-e07bc14ff4dd'::uuid,pm.id,'2025-09-01'::date,'B',60,120000,120000,'paid',now()
FROM pms_contract_monthly_projections proj JOIN pms_contract_payment_methods pm ON pm.contract_id=proj.contract_id
WHERE proj.contract_id='c7986757-cf43-442e-88d0-1f12ef085de2' AND proj.period_date='2025-09-01' AND proj.item='B' AND pm.item='B' AND pm.percentage=60 LIMIT 1;

INSERT INTO pms_payment_schedule_items (id,tenant_id,contract_id,projection_id,owner_id,payment_method_id,period_date,item,owner_percentage,expected_amount,accumulated_paid_amount,status,created_at)
SELECT '8f9c424e-db1d-411d-b35b-1ba2fc049ee2'::uuid,'8c5b46df-6090-4383-8995-a201ce7e5f9e'::uuid,'c7986757-cf43-442e-88d0-1f12ef085de2'::uuid,proj.id,'a6049676-4d22-4ef5-b67f-4a9ae78f9ab0'::uuid,pm.id,'2025-09-01'::date,'B',40,80000,80000,'paid',now()
FROM pms_contract_monthly_projections proj JOIN pms_contract_payment_methods pm ON pm.contract_id=proj.contract_id
WHERE proj.contract_id='c7986757-cf43-442e-88d0-1f12ef085de2' AND proj.period_date='2025-09-01' AND proj.item='B' AND pm.item='B' AND pm.percentage=40 LIMIT 1;

-- OCTUBRE (4 items) - UUIDs: 2bca4524, 7502c5d7, 364d76d4, 86f60479
INSERT INTO pms_payment_schedule_items (id,tenant_id,contract_id,projection_id,owner_id,payment_method_id,period_date,item,owner_percentage,expected_amount,accumulated_paid_amount,status,created_at)
SELECT '2bca4524-a07c-4c0e-ba56-dfb5c22c800d'::uuid,'8c5b46df-6090-4383-8995-a201ce7e5f9e'::uuid,'c7986757-cf43-442e-88d0-1f12ef085de2'::uuid,proj.id,'fefb4f5d-fa10-4666-b1f2-e07bc14ff4dd'::uuid,pm.id,'2025-10-01'::date,'A',60,300000,300000,'paid',now()
FROM pms_contract_monthly_projections proj JOIN pms_contract_payment_methods pm ON pm.contract_id=proj.contract_id
WHERE proj.contract_id='c7986757-cf43-442e-88d0-1f12ef085de2' AND proj.period_date='2025-10-01' AND proj.item='A' AND pm.item='A' AND pm.percentage=60 LIMIT 1;

INSERT INTO pms_payment_schedule_items (id,tenant_id,contract_id,projection_id,owner_id,payment_method_id,period_date,item,owner_percentage,expected_amount,accumulated_paid_amount,status,created_at)
SELECT '7502c5d7-e635-43da-817b-d826deabe5bb'::uuid,'8c5b46df-6090-4383-8995-a201ce7e5f9e'::uuid,'c7986757-cf43-442e-88d0-1f12ef085de2'::uuid,proj.id,'a6049676-4d22-4ef5-b67f-4a9ae78f9ab0'::uuid,pm.id,'2025-10-01'::date,'A',40,200000,200000,'paid',now()
FROM pms_contract_monthly_projections proj JOIN pms_contract_payment_methods pm ON pm.contract_id=proj.contract_id
WHERE proj.contract_id='c7986757-cf43-442e-88d0-1f12ef085de2' AND proj.period_date='2025-10-01' AND proj.item='A' AND pm.item='A' AND pm.percentage=40 LIMIT 1;

INSERT INTO pms_payment_schedule_items (id,tenant_id,contract_id,projection_id,owner_id,payment_method_id,period_date,item,owner_percentage,expected_amount,accumulated_paid_amount,status,created_at)
SELECT '364d76d4-1055-4f1c-9955-3b7c5676c7ec'::uuid,'8c5b46df-6090-4383-8995-a201ce7e5f9e'::uuid,'c7986757-cf43-442e-88d0-1f12ef085de2'::uuid,proj.id,'fefb4f5d-fa10-4666-b1f2-e07bc14ff4dd'::uuid,pm.id,'2025-10-01'::date,'B',60,120000,120000,'paid',now()
FROM pms_contract_monthly_projections proj JOIN pms_contract_payment_methods pm ON pm.contract_id=proj.contract_id
WHERE proj.contract_id='c7986757-cf43-442e-88d0-1f12ef085de2' AND proj.period_date='2025-10-01' AND proj.item='B' AND pm.item='B' AND pm.percentage=60 LIMIT 1;

INSERT INTO pms_payment_schedule_items (id,tenant_id,contract_id,projection_id,owner_id,payment_method_id,period_date,item,owner_percentage,expected_amount,accumulated_paid_amount,status,created_at)
SELECT '86f60479-ad2f-4483-9ad4-b80bb6fd657d'::uuid,'8c5b46df-6090-4383-8995-a201ce7e5f9e'::uuid,'c7986757-cf43-442e-88d0-1f12ef085de2'::uuid,proj.id,'a6049676-4d22-4ef5-b67f-4a9ae78f9ab0'::uuid,pm.id,'2025-10-01'::date,'B',40,80000,80000,'paid',now()
FROM pms_contract_monthly_projections proj JOIN pms_contract_payment_methods pm ON pm.contract_id=proj.contract_id
WHERE proj.contract_id='c7986757-cf43-442e-88d0-1f12ef085de2' AND proj.period_date='2025-10-01' AND proj.item='B' AND pm.item='B' AND pm.percentage=40 LIMIT 1;

-- Vincular 12 pagos a schedule items
UPDATE pms_payments SET schedule_item_id=((regexp_match(notes,'\[schedule_item:([a-f0-9\-]+)\]'))[1])::uuid
WHERE contract_id='c7986757-cf43-442e-88d0-1f12ef085de2' AND schedule_item_id IS NULL AND notes LIKE '%[schedule_item:%';