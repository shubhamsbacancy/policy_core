begin;

-- Demo seed data for Lone Star MGA / Texas HO3
insert into public.orgs (id, name, slug, jurisdiction, status)
values ('8f54f0b2-1376-4273-b2d5-df6088018f5b', 'Lone Star MGA', 'lone-star-mga', 'US-TX', 'active')
on conflict (id) do nothing;

insert into public.carriers (id, org_id, legal_name, naic_code, status)
values (
  '2ef9a1de-c7fa-485f-9b31-11e8f2a2e40f',
  '8f54f0b2-1376-4273-b2d5-df6088018f5b',
  'Lone Star Carrier Co',
  '12345',
  'active'
)
on conflict (id) do nothing;

insert into public.products (id, org_id, carrier_id, code, name, insurance_line, status)
values (
  '34c8d03a-7514-414e-8895-fc363bdca95f',
  '8f54f0b2-1376-4273-b2d5-df6088018f5b',
  '2ef9a1de-c7fa-485f-9b31-11e8f2a2e40f',
  'TX-HO3',
  'Texas Homeowners HO3',
  'homeowners',
  'active'
)
on conflict (id) do nothing;

insert into public.product_versions (id, org_id, product_id, version_label, effective_start, status, configuration)
values (
  'b75f2d92-788f-43cb-9b07-e76d9ba9e5ec',
  '8f54f0b2-1376-4273-b2d5-df6088018f5b',
  '34c8d03a-7514-414e-8895-fc363bdca95f',
  '2026.1',
  '2026-01-01',
  'active',
  '{"line":"homeowners","jurisdiction":"US-TX"}'::jsonb
)
on conflict (id) do nothing;

insert into public.coverage_definitions (org_id, product_version_id, code, label, limits, status)
values
  (
    '8f54f0b2-1376-4273-b2d5-df6088018f5b',
    'b75f2d92-788f-43cb-9b07-e76d9ba9e5ec',
    'dwelling',
    'Dwelling Coverage',
    '{"min":150000,"max":1500000}'::jsonb,
    'active'
  ),
  (
    '8f54f0b2-1376-4273-b2d5-df6088018f5b',
    'b75f2d92-788f-43cb-9b07-e76d9ba9e5ec',
    'liability',
    'Personal Liability',
    '{"min":100000,"max":1000000}'::jsonb,
    'active'
  )
;

insert into public.territories (org_id, code, state, county, rating_zone, status)
values
  ('8f54f0b2-1376-4273-b2d5-df6088018f5b', 'TX-HOU-01', 'TX', 'Harris', 'Urban Gulf', 'active'),
  ('8f54f0b2-1376-4273-b2d5-df6088018f5b', 'TX-DAL-01', 'TX', 'Dallas', 'Metro North', 'active')
on conflict (org_id, code) do nothing;

insert into public.compliance_rules (org_id, product_version_id, jurisdiction, rule_code, rule_body, status)
values (
  '8f54f0b2-1376-4273-b2d5-df6088018f5b',
  'b75f2d92-788f-43cb-9b07-e76d9ba9e5ec',
  'US-TX',
  'TX-HO3-DISCLOSURE-01',
  '{"description":"Basic Texas homeowners disclosure requirement placeholder for hackathon demo."}'::jsonb,
  'active'
)
;

commit;
