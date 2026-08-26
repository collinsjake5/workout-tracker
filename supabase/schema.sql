-- Workout tracker schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

create table if not exists exercises (
  id bigint generated always as identity primary key,
  day_key text not null,           -- 'push' | 'pull' | 'lower' | 'upper'
  order_index int not null,
  name text not null,
  target_sets int not null,
  target_reps text not null,       -- e.g. '8-10', '12-15 each', 'to failure'
  cue text                          -- short form cue
);

create table if not exists workout_logs (
  id bigint generated always as identity primary key,
  exercise_id bigint not null references exercises(id) on delete cascade,
  logged_date date not null default current_date,
  set_number int not null,
  weight numeric,                  -- lbs, per dumbbell
  reps int,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists workout_logs_exercise_idx on workout_logs(exercise_id);
create index if not exists workout_logs_date_idx on workout_logs(logged_date);

-- lets the app upsert (edit today's entry instead of duplicating rows)
create unique index if not exists workout_logs_unique_set
  on workout_logs(exercise_id, logged_date, set_number);

-- Single-user app, no login: open RLS policies on the anon role.
alter table exercises enable row level security;
alter table workout_logs enable row level security;

drop policy if exists "public read exercises" on exercises;
create policy "public read exercises" on exercises for select using (true);

drop policy if exists "public all workout_logs" on workout_logs;
create policy "public all workout_logs" on workout_logs for all using (true) with check (true);

-- Seed data: Push / Pull / Lower+Core / Full Upper
insert into exercises (day_key, order_index, name, target_sets, target_reps, cue) values
-- Monday: Push
('push', 1, 'Flat DB bench press', 4, '8-10', 'Elbows ~45°, press straight up over chest'),
('push', 2, 'Incline DB press (bench 30°)', 3, '10-12', 'Same path, bench angled up'),
('push', 3, 'Seated DB shoulder press', 3, '8-10', 'Press up and slightly in, avoid arching back'),
('push', 4, 'DB lateral raises', 3, '12-15', 'Lead with elbows, raise to shoulder height'),
('push', 5, 'Overhead DB triceps extension', 3, '10-12', 'Elbows in, lower behind head under control'),
('push', 6, 'Push-ups to failure', 2, 'to failure', 'Straight body line, chest to floor'),

-- Tuesday: Pull
('pull', 1, 'Single-arm DB row (knee on bench)', 4, '8-10 each', 'Pull elbow back to hip, flat back'),
('pull', 2, 'Chest-supported DB row (incline bench)', 3, '10-12', 'Chest on bench, pull to ribs'),
('pull', 3, 'DB pullover', 3, '10-12', 'Arc behind head, keep slight elbow bend'),
('pull', 4, 'Rear delt flyes (chest on incline bench)', 3, '12-15', 'Small arc, squeeze shoulder blades'),
('pull', 5, 'DB hammer curls', 3, '10-12', 'Neutral grip, elbows pinned'),
('pull', 6, 'DB bicep curls', 3, '10-12', 'Palms up, no swinging'),

-- Thursday: Lower + Core
('lower', 1, 'Goblet squats', 4, '10-12', 'DB at chest, sit hips back and down'),
('lower', 2, 'DB Romanian deadlifts', 4, '10-12', 'Hinge at hips, slight knee bend, DBs close to legs'),
('lower', 3, 'Bulgarian split squats (rear foot on bench)', 3, '8-10 each', 'Torso upright, front knee tracks over foot'),
('lower', 4, 'DB step-ups onto bench', 3, '10 each', 'Drive through heel, stand fully tall'),
('lower', 5, 'Standing calf raises holding DBs', 3, '15-20', 'Full stretch at bottom, pause at top'),
('lower', 6, 'Plank', 3, '45-60s', 'Straight line, ribs down'),
('lower', 7, 'Dead bugs', 3, '10 each', 'Low back flat, opposite arm/leg'),
('lower', 8, 'Leg raises', 3, '12', 'Control the lower, avoid low-back arch'),

-- Friday: Full Upper
('upper', 1, 'DB floor press or bench press (heavier)', 4, '6-8', 'Shorter, harder press for strength'),
('upper', 2, 'Bent-over two-DB row', 4, '8-10', 'Flat back, pull to lower ribs'),
('upper', 3, 'Arnold press', 3, '10-12', 'Rotate palms out as you press'),
('upper', 4, 'Incline DB flyes', 3, '12', 'Slight elbow bend, wide arc'),
('upper', 5, 'DB shrugs', 3, '12-15', 'Straight up, no rolling'),
('upper', 6, 'DB curls (superset)', 3, '10-12', 'Pair with skullcrushers, no rest between'),
('upper', 7, 'Skullcrushers on bench (superset)', 3, '10-12', 'Elbows fixed, lower to forehead');
