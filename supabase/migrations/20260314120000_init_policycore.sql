begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.generate_business_number(prefix text)
returns text
language plpgsql
as $$
declare
  rand text;
begin
  rand := lpad((floor(random() * 1000000))::int::text, 6, '0');
  return prefix || '-' || to_char(timezone('utc', now()), 'YYYYMMDD') || '-' || rand;
end;
$$;

create or replace function public.prevent_immutable_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Table % is immutable in PolicyCore.', tg_table_name;
end;
$$;

create or replace function public.prevent_business_number_update()
returns trigger
language plpgsql
as $$
begin
  if to_jsonb(new) ->> tg_argv[0] is distinct from to_jsonb(old) ->> tg_argv[0] then
    raise exception 'Business number % cannot be changed on %.', tg_argv[0], tg_table_name;
  end if;
  return new;
end;
$$;

create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  jurisdiction text not null default 'US-TX',
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references public.orgs(id) on delete set null,
  status text not null default 'active',
  full_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.org_memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  membership_type text not null default 'member',
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  unique (org_id, user_id)
);

create table if not exists public.role_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_key text not null,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  unique (org_id, user_id, role_key)
);

create table if not exists public.carriers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  legal_name text not null,
  naic_code text,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  carrier_id uuid not null references public.carriers(id) on delete cascade,
  code text not null,
  name text not null,
  insurance_line text not null default 'homeowners',
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  unique (org_id, code)
);

create table if not exists public.product_versions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  version_label text not null,
  effective_start date not null,
  effective_end date,
  status text not null default 'active',
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  unique (product_id, version_label)
);

create table if not exists public.coverage_definitions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  product_version_id uuid not null references public.product_versions(id) on delete cascade,
  code text not null,
  label text not null,
  limits jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  unique (product_version_id, code)
);

create table if not exists public.territories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  code text not null,
  state text not null default 'TX',
  county text,
  rating_zone text,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  unique (org_id, code)
);

create table if not exists public.rating_factor_definitions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  product_version_id uuid not null references public.product_versions(id) on delete cascade,
  code text not null,
  label text not null,
  factor_type text not null,
  rules jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.compliance_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  product_version_id uuid references public.product_versions(id) on delete set null,
  jurisdiction text not null default 'US-TX',
  rule_code text not null,
  rule_body jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.policyholders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  status text not null default 'active',
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.insured_properties (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  policyholder_id uuid not null references public.policyholders(id) on delete cascade,
  address_line_1 text not null,
  city text not null,
  state text not null default 'TX',
  postal_code text not null,
  territory_code text,
  property_attributes jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  policyholder_id uuid references public.policyholders(id) on delete set null,
  insured_property_id uuid references public.insured_properties(id) on delete set null,
  product_version_id uuid references public.product_versions(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  status text not null default 'submitted',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.application_documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  storage_path text not null,
  document_metadata jsonb not null default '{}'::jsonb,
  status text not null default 'uploaded',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  quote_number text not null unique default public.generate_business_number('QTE'),
  premium numeric(14,2) not null default 0,
  taxes numeric(14,2) not null default 0,
  fees numeric(14,2) not null default 0,
  total_premium numeric(14,2) not null default 0,
  currency text not null default 'USD',
  rating_breakdown jsonb not null default '{}'::jsonb,
  coverage_snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'quoted',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.quote_versions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  version_no int not null,
  coverage_snapshot jsonb not null default '{}'::jsonb,
  rating_breakdown jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  unique (quote_id, version_no)
);

create table if not exists public.risk_assessments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  ai_inputs jsonb not null default '{}'::jsonb,
  ai_outputs jsonb not null default '{}'::jsonb,
  risk_score int,
  risk_tier text,
  recommended_action text,
  status text not null default 'generated',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.underwriting_reviews (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  risk_assessment_id uuid references public.risk_assessments(id) on delete set null,
  decision text not null,
  rationale text,
  status text not null default 'completed',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  policy_number text not null unique default public.generate_business_number('POL'),
  effective_date date not null,
  expiration_date date not null,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.policy_terms (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  policy_id uuid not null references public.policies(id) on delete cascade,
  term_no int not null default 1,
  coverage_snapshot jsonb not null default '{}'::jsonb,
  rating_breakdown jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  unique (policy_id, term_no)
);

create table if not exists public.endorsements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  policy_id uuid not null references public.policies(id) on delete cascade,
  change_set jsonb not null default '{}'::jsonb,
  effective_date date not null,
  reason text,
  status text not null default 'issued',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.renewal_offers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  policy_id uuid not null references public.policies(id) on delete cascade,
  target_effective_date date not null,
  offer_payload jsonb not null default '{}'::jsonb,
  status text not null default 'offered',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.cancellations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  policy_id uuid not null references public.policies(id) on delete cascade,
  reason text not null,
  requested_cancel_date date not null,
  status text not null default 'requested',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  policy_id uuid not null references public.policies(id) on delete cascade,
  invoice_number text not null unique default public.generate_business_number('INV'),
  amount_due numeric(14,2) not null default 0,
  due_date date not null,
  currency text not null default 'USD',
  status text not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(14,2) not null,
  payment_method text not null,
  external_reference text,
  status text not null default 'recorded',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  policy_id uuid not null references public.policies(id) on delete cascade,
  claim_number text not null unique default public.generate_business_number('CLM'),
  incident_date date not null,
  description text not null,
  estimated_loss_amount numeric(14,2) not null default 0,
  status text not null default 'open',
  ai_inputs jsonb not null default '{}'::jsonb,
  ai_outputs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.claim_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  claim_id uuid not null references public.claims(id) on delete cascade,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  status text not null default 'recorded',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.claim_reserves (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  claim_id uuid not null references public.claims(id) on delete cascade,
  reserve_amount numeric(14,2) not null default 0,
  status text not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  policy_id uuid not null references public.policies(id) on delete cascade,
  payee_user_id uuid references auth.users(id) on delete set null,
  amount numeric(14,2) not null default 0,
  status text not null default 'calculated',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.workflow_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  assigned_user_id uuid references auth.users(id) on delete set null,
  task_type text not null,
  due_at timestamptz,
  status text not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  channel text not null,
  message text not null,
  status text not null default 'queued',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_state jsonb,
  after_state jsonb,
  status text not null default 'recorded',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

do $$
declare
  t text;
begin
  foreach t in array array[
    'orgs',
    'profiles',
    'org_memberships',
    'role_assignments',
    'carriers',
    'products',
    'product_versions',
    'coverage_definitions',
    'territories',
    'rating_factor_definitions',
    'compliance_rules',
    'policyholders',
    'insured_properties',
    'applications',
    'application_documents',
    'quotes',
    'quote_versions',
    'risk_assessments',
    'underwriting_reviews',
    'policies',
    'policy_terms',
    'endorsements',
    'renewal_offers',
    'cancellations',
    'invoices',
    'payments',
    'claims',
    'claim_events',
    'claim_reserves',
    'commissions',
    'workflow_tasks',
    'notifications',
    'audit_logs'
  ]
  loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
  end loop;
end $$;

create trigger quote_number_immutable
before update on public.quotes
for each row
execute function public.prevent_business_number_update('quote_number');

create trigger policy_number_immutable
before update on public.policies
for each row
execute function public.prevent_business_number_update('policy_number');

create trigger claim_number_immutable
before update on public.claims
for each row
execute function public.prevent_business_number_update('claim_number');

create trigger invoice_number_immutable
before update on public.invoices
for each row
execute function public.prevent_business_number_update('invoice_number');

create trigger product_versions_immutable
before update or delete on public.product_versions
for each row
execute function public.prevent_immutable_mutation();

create trigger quote_versions_immutable
before update or delete on public.quote_versions
for each row
execute function public.prevent_immutable_mutation();

create trigger policy_terms_immutable
before update or delete on public.policy_terms
for each row
execute function public.prevent_immutable_mutation();

create or replace function public.user_has_org_access(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_memberships m
    where m.org_id = target_org
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

grant execute on function public.user_has_org_access(uuid) to authenticated;

alter table public.orgs enable row level security;
create policy orgs_select on public.orgs
for select using (public.user_has_org_access(id));
create policy orgs_insert on public.orgs
for insert with check (auth.uid() is not null);
create policy orgs_update on public.orgs
for update using (public.user_has_org_access(id))
with check (public.user_has_org_access(id));

alter table public.profiles enable row level security;
create policy profiles_select on public.profiles
for select using (id = auth.uid() or (org_id is not null and public.user_has_org_access(org_id)));
create policy profiles_insert on public.profiles
for insert with check (id = auth.uid());
create policy profiles_update on public.profiles
for update using (id = auth.uid())
with check (id = auth.uid());

alter table public.org_memberships enable row level security;
create policy memberships_select on public.org_memberships
for select using (user_id = auth.uid() or public.user_has_org_access(org_id));
create policy memberships_insert on public.org_memberships
for insert with check (public.user_has_org_access(org_id));
create policy memberships_update on public.org_memberships
for update using (public.user_has_org_access(org_id))
with check (public.user_has_org_access(org_id));
create policy memberships_delete on public.org_memberships
for delete using (public.user_has_org_access(org_id));

do $$
declare
  t text;
begin
  foreach t in array array[
    'role_assignments',
    'carriers',
    'products',
    'product_versions',
    'coverage_definitions',
    'territories',
    'rating_factor_definitions',
    'compliance_rules',
    'policyholders',
    'insured_properties',
    'applications',
    'application_documents',
    'quotes',
    'quote_versions',
    'risk_assessments',
    'underwriting_reviews',
    'policies',
    'policy_terms',
    'endorsements',
    'renewal_offers',
    'cancellations',
    'invoices',
    'payments',
    'claims',
    'claim_events',
    'claim_reserves',
    'commissions',
    'workflow_tasks',
    'notifications',
    'audit_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select using (public.user_has_org_access(org_id))', t || '_select', t);
    execute format('create policy %I on public.%I for insert with check (public.user_has_org_access(org_id))', t || '_insert', t);
    execute format('create policy %I on public.%I for update using (public.user_has_org_access(org_id)) with check (public.user_has_org_access(org_id))', t || '_update', t);
    execute format('create policy %I on public.%I for delete using (public.user_has_org_access(org_id))', t || '_delete', t);
  end loop;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles',
    'org_memberships',
    'role_assignments',
    'carriers',
    'products',
    'product_versions',
    'coverage_definitions',
    'territories',
    'rating_factor_definitions',
    'compliance_rules',
    'policyholders',
    'insured_properties',
    'applications',
    'application_documents',
    'quotes',
    'quote_versions',
    'risk_assessments',
    'underwriting_reviews',
    'policies',
    'policy_terms',
    'endorsements',
    'renewal_offers',
    'cancellations',
    'invoices',
    'payments',
    'claims',
    'claim_events',
    'claim_reserves',
    'commissions',
    'workflow_tasks',
    'notifications',
    'audit_logs'
  ]
  loop
    execute format('create index if not exists %I on public.%I (org_id)', t || '_org_idx', t);
  end loop;
end $$;

create index if not exists quotes_application_idx on public.quotes (application_id);
create index if not exists policies_quote_idx on public.policies (quote_id);
create index if not exists invoices_policy_idx on public.invoices (policy_id);
create index if not exists payments_invoice_idx on public.payments (invoice_id);
create index if not exists claims_policy_idx on public.claims (policy_id);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

commit;
