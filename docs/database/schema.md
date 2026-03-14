# Database Schema Overview

## Core Relationship Graph
- `orgs -> org_memberships -> profiles`
- `products -> product_versions -> coverage_definitions + rating_factor_definitions`
- `applications -> quotes -> policies -> policy_terms`
- `policies -> endorsements + renewal_offers + cancellations`
- `claims -> claim_events + claim_reserves`
- `invoices -> payments`

## Required Tables
- `profiles`, `orgs`, `org_memberships`, `role_assignments`
- `carriers`, `products`, `product_versions`, `coverage_definitions`
- `territories`, `rating_factor_definitions`, `compliance_rules`
- `policyholders`, `insured_properties`, `applications`, `application_documents`
- `quotes`, `quote_versions`, `risk_assessments`, `underwriting_reviews`
- `policies`, `policy_terms`, `endorsements`, `renewal_offers`, `cancellations`
- `invoices`, `payments`, `claims`, `claim_events`, `claim_reserves`
- `commissions`, `workflow_tasks`, `notifications`, `audit_logs`

## Required Column Conventions
- Domain/business tables include: `org_id`, `status`, `created_at`, `updated_at`, `created_by`.
- `quotes`, `policies`, `claims`, `invoices` include immutable business numbers.
- Fast-evolving payloads use JSONB:
  - `property_attributes`
  - `coverage_snapshot`
  - `rating_breakdown`
  - `ai_inputs`
  - `ai_outputs`
  - `document_metadata`

## Immutability Rules
- `product_versions`, `quote_versions`, and `policy_terms` are append-only.
- Business number columns are immutable once set.

## RLS
- RLS is enabled for all exposed tables.
- Access is granted based on active `org_memberships`.
- Service-role bypass is never used from browser clients.
