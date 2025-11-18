-- Eliminar los 6 items duplicados del contrato PRIMA4302 (creados 2025-11-18)
-- Conservando solo los items originales (creados 2025-11-02)

DELETE FROM pms_payment_schedule_items
WHERE id IN (
  -- Agosto duplicados (creados 2025-11-18)
  '2ac73831-8fc7-4f39-b403-bace710cbdb3',  -- ACTUALTECH 40%
  '15c3ac99-a1a8-49e9-8269-6979dcef3f47',  -- LEONARDO 60%
  -- Septiembre duplicados (creados 2025-11-18)
  'bde717b5-9937-45f6-8b80-e068deb06db4',  -- ACTUALTECH 40%
  'c4a91b43-39b2-431a-93c8-b8affa68cddb',  -- LEONARDO 60%
  -- Octubre duplicados (creados 2025-11-18)
  '59db8f4a-aa3e-4a47-b568-be65646e6921',  -- ACTUALTECH 40%
  '022006fb-5e0a-4c7d-baf9-a0803fc73b89'   -- LEONARDO 60%
);

-- Verificar que solo quedan 6 items correctos (2 por cada mes: Ago, Sep, Oct)
-- Los items restantes deben tener status 'paid' y created_at '2025-11-02'