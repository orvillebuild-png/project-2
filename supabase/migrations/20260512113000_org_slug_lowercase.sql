create unique index if not exists orgs_slug_lower_idx on public.orgs (lower(slug));
