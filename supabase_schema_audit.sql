-- Create the admin_audit_log table
create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid references auth.users(id) not null,
  action text not null,
  details jsonb default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.admin_audit_log enable row level security;

-- Policy: Only admins can view audit logs
create policy "Admins can view audit logs"
  on public.admin_audit_log
  for select
  using (
    auth.uid() in (
      select id from public.users where user_role = 'admin'
    )
  );

-- Policy: Only service role or admins can insert (usually backend service role)
create policy "Service role can insert audit logs"
  on public.admin_audit_log
  for insert
  with check (true);

-- Create index for faster queries
create index admin_audit_log_admin_id_idx on public.admin_audit_log(admin_id);
create index admin_audit_log_action_idx on public.admin_audit_log(action);
create index admin_audit_log_created_at_idx on public.admin_audit_log(created_at);
