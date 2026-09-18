-- Migration 001 — run this in the Supabase SQL editor if you already ran schema.sql.
-- Safe to run more than once. Nothing is deleted: retired exercises are archived,
-- so their logged sets stay in History.

-- 1. New flags on exercises.
alter table exercises add column if not exists bodyweight boolean not null default false;
alter table exercises add column if not exists archived boolean not null default false;

-- 2. Lower + Core: the bench step-up needs more ceiling than the room has.
--    Reverse lunges keep the single-leg work at floor level.
update exercises set archived = true
where day_key = 'lower' and name = 'DB step-ups onto bench';

insert into exercises (day_key, order_index, name, target_sets, target_reps, cue)
select 'lower', 4, 'DB reverse lunges', 3, '10 each',
       'Step back, drop rear knee, drive through front heel'
where not exists (
  select 1 from exercises where day_key = 'lower' and name = 'DB reverse lunges'
);

-- 3. Lower + Core: dead bugs out, scissor kicks in.
update exercises set archived = true
where day_key = 'lower' and name = 'Dead bugs';

insert into exercises (day_key, order_index, name, target_sets, target_reps, cue, bodyweight)
select 'lower', 7, 'Scissor kicks', 3, '20-30',
       'Low back flat, legs straight, small quick crosses', true
where not exists (
  select 1 from exercises where day_key = 'lower' and name = 'Scissor kicks'
);

-- 4. Bodyweight movements: reps (or seconds) only, no weight box.
update exercises set bodyweight = true
where name in ('Push-ups to failure', 'Plank', 'Scissor kicks', 'Leg raises');

-- 5. Clear any weight already logged against those, so History/Progress stay clean.
update workout_logs set weight = null
where weight is not null
  and exercise_id in (select id from exercises where bodyweight);
