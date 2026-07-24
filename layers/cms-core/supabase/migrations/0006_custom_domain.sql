-- Lets a site be reached by its own domain. Actually resolving incoming
-- requests by hostname to a site happens in Nitro middleware
-- (server/middleware/resolve-tenant-domain.ts), not in the database — this
-- column is just where that mapping is stored.
alter table public.sites
    add column custom_domain text unique;
