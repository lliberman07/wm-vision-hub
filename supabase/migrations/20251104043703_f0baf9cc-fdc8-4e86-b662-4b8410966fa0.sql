-- =========================
-- CONVERGENCIA MULTI-TENANT (CORREGIDO)
-- =========================

create extension if not exists pgcrypto;

-- 1) VISTA: Tenants y roles del usuario (usa user_roles existente)
create or replace view v_current_user_tenants as
select
  ur.user_id,
  ur.tenant_id,
  t.slug,
  t.name,
  t.tenant_type as type,
  array_agg(ur.role::text order by ur.role::text) as roles
from user_roles ur
join pms_tenants t on t.id = ur.tenant_id
where ur.module = 'PMS' and ur.status = 'approved'
group by ur.user_id, ur.tenant_id, t.slug, t.name, t.tenant_type;

-- 2) VISTA: Roles extendidos (para panel Roles)
create or replace view v_roles_extended as
select
  ur.id,
  ur.user_id,
  coalesce(au.email, u.email) as email,
  ur.tenant_id,
  t.slug,
  t.name as tenant_name,
  t.tenant_type,
  ur.role::text as role_type,
  ur.created_at as assigned_at
from user_roles ur
join pms_tenants t on t.id = ur.tenant_id
left join auth.users au on au.id = ur.user_id
left join users u on u.id = ur.user_id
where ur.module = 'PMS';

-- 3) Helper: ¿es superadmin del tenant "sistema"?
create or replace function is_superadmin_pms() returns boolean
language sql stable as $$
  select exists (
    select 1
    from user_roles ur
    join pms_tenants t on t.id = ur.tenant_id
    where ur.user_id = auth.uid()
      and ur.module  = 'PMS'
      and ur.role::text = 'SUPERADMIN'
      and t.tenant_type = 'sistema'
      and ur.status = 'approved'
  );
$$;

-- 4) Tabla relacional de partes de contrato (propietario/inquilino/garante/adm)
create table if not exists pms_contract_parties (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references pms_contracts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references pms_tenants(id) on delete cascade,
  party_role text not null check (party_role in ('propietario','inquilino','garante','administrador')),
  created_at timestamptz default now(),
  unique (contract_id, user_id, party_role)
);

create index if not exists idx_contract_parties_contract on pms_contract_parties(contract_id);
create index if not exists idx_contract_parties_user    on pms_contract_parties(user_id);
create index if not exists idx_contract_parties_tenant  on pms_contract_parties(tenant_id);

-- 5) RLS solo para la tabla nueva (sin tocar lo existente)
alter table pms_contract_parties enable row level security;

drop policy if exists parties_read on pms_contract_parties;
create policy parties_read on pms_contract_parties
for select using (
  is_superadmin_pms() or exists (
    select 1
    from user_roles r
    where r.user_id = auth.uid()
      and r.module = 'PMS'
      and r.status = 'approved'
      and r.tenant_id = pms_contract_parties.tenant_id
  )
);

drop policy if exists parties_ins on pms_contract_parties;
create policy parties_ins on pms_contract_parties
for insert with check (
  is_superadmin_pms() or exists (
    select 1
    from user_roles r
    where r.user_id = auth.uid()
      and r.module = 'PMS'
      and r.status = 'approved'
      and r.tenant_id = pms_contract_parties.tenant_id
      and r.role::text in ('ADMINISTRADOR','INMOBILIARIA','SUPERADMIN')
  )
);

-- 6) Backfill NO destructivo (solo completa si faltan relaciones; no toca tenant_id)
-- Propietarios desde ownership vigente
insert into pms_contract_parties (contract_id, user_id, tenant_id, party_role)
select
  c.id,
  o.user_id,
  c.tenant_id,
  'propietario'
from pms_contracts c
join pms_owner_properties op on op.property_id = c.property_id
join pms_owners o on o.id = op.owner_id
where o.user_id is not null
  and (op.end_date is null or op.end_date >= current_date)
on conflict do nothing;

-- Inquilinos desde relación del contrato
insert into pms_contract_parties (contract_id, user_id, tenant_id, party_role)
select
  c.id,
  tr.user_id,
  c.tenant_id,
  'inquilino'
from pms_contracts c
join pms_tenants_renters tr on tr.id = c.tenant_renter_id
where tr.user_id is not null
on conflict do nothing;