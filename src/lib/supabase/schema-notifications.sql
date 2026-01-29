-- Create table for global notifications
create table if not exists global_notifications (
  id uuid default gen_random_uuid() primary key,
  message text not null,
  type text default 'info', -- info, warning, error, success
  is_active boolean default true,
  expires_at timestamptz,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- Enable RLS
alter table global_notifications enable row level security;

-- Policy: Everyone can read active notifications
create policy "Everyone can read active notifications"
  on global_notifications for select
  using (is_active = true and (expires_at is null or expires_at > now()));

-- Policy: Only Admins (specific email) can insert/update/delete
-- Note: In production, use Custom Claims or a Roles table. For now, we use email check in middleware/application logic
-- But for RLS, we can restrict writing to Authenticated users for now, and rely on App Logic to gate the creating page.
-- Or ideally:
-- create policy "Admins can do everything" on global_notifications
--   using (auth.jwt() ->> 'email' = 'rendyakun50@gmail.com')
--   with check (auth.jwt() ->> 'email' = 'rendyakun50@gmail.com');

create policy "Admins can manage notifications"
  on global_notifications for all
  using (auth.jwt() ->> 'email' = 'rendyakun50@gmail.com')
  with check (auth.jwt() ->> 'email' = 'rendyakun50@gmail.com');
