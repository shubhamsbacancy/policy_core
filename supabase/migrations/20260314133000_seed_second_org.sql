begin;

-- Second demo org for org switcher
insert into public.orgs (id, name, slug, jurisdiction, status)
values ('c4a4e6d4-9e2b-4b5f-9c3a-2d7b5e9c1f22', 'Hill Country Mutual', 'hill-country-mutual', 'US-TX', 'active')
on conflict (id) do nothing;

insert into public.carriers (id, org_id, legal_name, naic_code, status)
values (
  'f9a4a9c0-1f5e-4b2e-9c4b-9b2d2e9c4f6a',
  'c4a4e6d4-9e2b-4b5f-9c3a-2d7b5e9c1f22',
  'Hill Country Carrier',
  '67890',
  'active'
)
on conflict (id) do nothing;

insert into public.products (id, org_id, carrier_id, code, name, insurance_line, status)
values (
  '9e2d4f6a-1b2c-3d4e-5f6a-7b8c9d0e1f2a',
  'c4a4e6d4-9e2b-4b5f-9c3a-2d7b5e9c1f22',
  'f9a4a9c0-1f5e-4b2e-9c4b-9b2d2e9c4f6a',
  'TX-HO3-B',
  'Texas Homeowners HO3 (Hill Country)',
  'homeowners',
  'active'
)
on conflict (id) do nothing;

insert into public.product_versions (id, org_id, product_id, version_label, effective_start, status, configuration)
values (
  '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  'c4a4e6d4-9e2b-4b5f-9c3a-2d7b5e9c1f22',
  '9e2d4f6a-1b2c-3d4e-5f6a-7b8c9d0e1f2a',
  '2026.1',
  '2026-02-01',
  'active',
  '{"line":"homeowners","jurisdiction":"US-TX"}'::jsonb
)
on conflict (id) do nothing;

commit;
