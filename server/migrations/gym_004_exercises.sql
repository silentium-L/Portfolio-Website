-- Migration gym_004: Übungs-Datenbank
-- Tabellen: exercises, muscle_groups, exercise_muscle_groups (many-to-many)
-- Voraussetzung: keine (unabhängig von gym_users)
-- Ausführen: psql $DATABASE_URL -f migrations/gym_004_exercises.sql

-- ─── Enums ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE gym_equipment_type AS ENUM (
    'MACHINE',    -- Maschine
    'DUMBBELL',   -- Kurzhantel
    'BARBELL',    -- Langhantel
    'CARDIO',     -- Cardio-Gerät
    'BODYWEIGHT', -- Körpergewicht
    'STRETCH'     -- Dehnung
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE gym_tracking_type AS ENUM (
    'REPS',  -- Wiederholungen
    'TIME'   -- Zeit (Sekunden)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Tabelle: muscle_groups ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gym_muscle_groups (
  id         SERIAL      PRIMARY KEY,
  name       VARCHAR(64) NOT NULL UNIQUE,
  name_de    VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabelle: exercises ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gym_exercises (
  id            SERIAL               PRIMARY KEY,
  name          VARCHAR(128)         NOT NULL UNIQUE,
  name_de       VARCHAR(128)         NOT NULL,
  unilateral    BOOLEAN              NOT NULL DEFAULT FALSE,
  equipment     gym_equipment_type   NOT NULL,
  tracking_type gym_tracking_type    NOT NULL DEFAULT 'REPS',
  created_at    TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

-- ─── Tabelle: exercise_muscle_groups (many-to-many) ──────────────────────────

CREATE TABLE IF NOT EXISTS gym_exercise_muscle_groups (
  exercise_id     INTEGER NOT NULL REFERENCES gym_exercises(id)      ON DELETE CASCADE,
  muscle_group_id INTEGER NOT NULL REFERENCES gym_muscle_groups(id)  ON DELETE CASCADE,
  is_primary      BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (exercise_id, muscle_group_id)
);

CREATE INDEX IF NOT EXISTS idx_gym_emg_exercise
  ON gym_exercise_muscle_groups (exercise_id);
CREATE INDEX IF NOT EXISTS idx_gym_emg_muscle_group
  ON gym_exercise_muscle_groups (muscle_group_id);

-- ─── Seed: Muskelgruppen ─────────────────────────────────────────────────────

INSERT INTO gym_muscle_groups (name, name_de) VALUES
  ('chest',           'Brust'),
  ('back',            'Rücken'),
  ('shoulders',       'Schultern'),
  ('biceps',          'Bizeps'),
  ('triceps',         'Trizeps'),
  ('forearms',        'Unterarme'),
  ('core',            'Bauch/Core'),
  ('glutes',          'Gesäß'),
  ('quadriceps',      'Quadrizeps'),
  ('hamstrings',      'Beinbizeps'),
  ('calves',          'Waden'),
  ('hip_flexors',     'Hüftbeuger'),
  ('lower_back',      'Unterer Rücken'),
  ('traps',           'Trapezmuskel')
ON CONFLICT (name) DO NOTHING;

-- ─── Seed: Übungen ───────────────────────────────────────────────────────────

INSERT INTO gym_exercises (name, name_de, unilateral, equipment, tracking_type) VALUES
  -- Brust
  ('Bench Press',           'Bankdrücken',              FALSE, 'BARBELL',    'REPS'),
  ('Incline Bench Press',   'Schrägbankdrücken',        FALSE, 'BARBELL',    'REPS'),
  ('Dumbbell Flye',         'Butterfly Kurzhantel',     FALSE, 'DUMBBELL',   'REPS'),
  ('Cable Crossover',       'Kabelzug Crossover',       FALSE, 'MACHINE',    'REPS'),
  ('Chest Press Machine',   'Brustpresse Maschine',     FALSE, 'MACHINE',    'REPS'),
  ('Push-Up',               'Liegestütz',               FALSE, 'BODYWEIGHT', 'REPS'),

  -- Rücken
  ('Deadlift',              'Kreuzheben',               FALSE, 'BARBELL',    'REPS'),
  ('Pull-Up',               'Klimmzug',                 FALSE, 'BODYWEIGHT', 'REPS'),
  ('Bent-Over Row',         'Vorgebeugtes Rudern',      FALSE, 'BARBELL',    'REPS'),
  ('Dumbbell Row',          'Kurzhantel Rudern',        TRUE,  'DUMBBELL',   'REPS'),
  ('Lat Pulldown',          'Latziehen',                FALSE, 'MACHINE',    'REPS'),
  ('Seated Cable Row',      'Kabelrudern sitzend',      FALSE, 'MACHINE',    'REPS'),
  ('T-Bar Row',             'T-Rudern',                 FALSE, 'BARBELL',    'REPS'),

  -- Schultern
  ('Overhead Press',        'Schulterdrücken',          FALSE, 'BARBELL',    'REPS'),
  ('Dumbbell Press',        'Schulterdrücken KH',       FALSE, 'DUMBBELL',   'REPS'),
  ('Lateral Raise',         'Seitheben',                FALSE, 'DUMBBELL',   'REPS'),
  ('Front Raise',           'Frontheben',               FALSE, 'DUMBBELL',   'REPS'),
  ('Reverse Flye',          'Reverse Butterfly',        FALSE, 'DUMBBELL',   'REPS'),
  ('Face Pull',             'Face Pull',                FALSE, 'MACHINE',    'REPS'),

  -- Bizeps
  ('Barbell Curl',          'Bizepscurl Langhantel',    FALSE, 'BARBELL',    'REPS'),
  ('Dumbbell Curl',         'Bizepscurl Kurzhantel',    TRUE,  'DUMBBELL',   'REPS'),
  ('Hammer Curl',           'Hammer Curl',              TRUE,  'DUMBBELL',   'REPS'),
  ('Cable Curl',            'Kabelzug Curl',            FALSE, 'MACHINE',    'REPS'),
  ('Preacher Curl',         'Prediger Curl',            FALSE, 'MACHINE',    'REPS'),

  -- Trizeps
  ('Tricep Dip',            'Dips',                     FALSE, 'BODYWEIGHT', 'REPS'),
  ('Skull Crusher',         'Stirndrücken',             FALSE, 'BARBELL',    'REPS'),
  ('Tricep Pushdown',       'Trizeps Pushdown',         FALSE, 'MACHINE',    'REPS'),
  ('Overhead Tricep Ext.',  'Trizeps Überkopf',         FALSE, 'DUMBBELL',   'REPS'),

  -- Beine
  ('Squat',                 'Kniebeuge',                FALSE, 'BARBELL',    'REPS'),
  ('Leg Press',             'Beinpresse',               FALSE, 'MACHINE',    'REPS'),
  ('Leg Extension',         'Beinstrecker',             FALSE, 'MACHINE',    'REPS'),
  ('Leg Curl',              'Beinbeuger',               FALSE, 'MACHINE',    'REPS'),
  ('Romanian Deadlift',     'Rumänisches Kreuzheben',   FALSE, 'BARBELL',    'REPS'),
  ('Bulgarian Split Squat', 'Bulgarische Kniebeuge',    TRUE,  'DUMBBELL',   'REPS'),
  ('Hip Thrust',            'Hip Thrust',               FALSE, 'BARBELL',    'REPS'),
  ('Calf Raise',            'Wadenheben',               FALSE, 'MACHINE',    'REPS'),
  ('Lunge',                 'Ausfallschritt',           TRUE,  'DUMBBELL',   'REPS'),

  -- Core
  ('Plank',                 'Unterarmstütz',            FALSE, 'BODYWEIGHT', 'TIME'),
  ('Crunch',                'Crunch',                   FALSE, 'BODYWEIGHT', 'REPS'),
  ('Hanging Leg Raise',     'Hängendes Beinheben',      FALSE, 'BODYWEIGHT', 'REPS'),
  ('Ab Wheel Rollout',      'Bauchrad',                 FALSE, 'BODYWEIGHT', 'REPS'),
  ('Russian Twist',         'Russian Twist',            FALSE, 'BODYWEIGHT', 'REPS'),
  ('Cable Crunch',          'Kabelzug Crunch',          FALSE, 'MACHINE',    'REPS'),

  -- Cardio
  ('Treadmill Run',         'Laufband',                 FALSE, 'CARDIO',     'TIME'),
  ('Rowing Machine',        'Ruderergometer',           FALSE, 'CARDIO',     'TIME'),
  ('Cycling',               'Fahrrad/Ergometer',        FALSE, 'CARDIO',     'TIME'),
  ('Elliptical',            'Crosstrainer',             FALSE, 'CARDIO',     'TIME'),
  ('Stair Climber',         'Treppensteiger',           FALSE, 'CARDIO',     'TIME'),
  ('Jump Rope',             'Seilspringen',             FALSE, 'CARDIO',     'TIME'),

  -- Dehnung
  ('Hip Flexor Stretch',    'Hüftbeuger Dehnung',       TRUE,  'STRETCH',    'TIME'),
  ('Hamstring Stretch',     'Beinbizeps Dehnung',       TRUE,  'STRETCH',    'TIME'),
  ('Chest Stretch',         'Brust Dehnung',            FALSE, 'STRETCH',    'TIME'),
  ('Shoulder Stretch',      'Schulter Dehnung',         TRUE,  'STRETCH',    'TIME'),
  ('Child''s Pose',         'Kind-Haltung',             FALSE, 'STRETCH',    'TIME'),
  ('Pigeon Pose',           'Tauben-Pose',              TRUE,  'STRETCH',    'TIME')
ON CONFLICT (name) DO NOTHING;

-- ─── Seed: Muskelgruppen-Zuordnungen ─────────────────────────────────────────
-- is_primary = TRUE  → Hauptmuskel
-- is_primary = FALSE → Hilfsmuskel

INSERT INTO gym_exercise_muscle_groups (exercise_id, muscle_group_id, is_primary)
SELECT e.id, mg.id, m.is_primary
FROM (VALUES
  -- Brust
  ('Bench Press',           'chest',        TRUE),
  ('Bench Press',           'triceps',      FALSE),
  ('Bench Press',           'shoulders',    FALSE),
  ('Incline Bench Press',   'chest',        TRUE),
  ('Incline Bench Press',   'shoulders',    FALSE),
  ('Incline Bench Press',   'triceps',      FALSE),
  ('Dumbbell Flye',         'chest',        TRUE),
  ('Dumbbell Flye',         'shoulders',    FALSE),
  ('Cable Crossover',       'chest',        TRUE),
  ('Chest Press Machine',   'chest',        TRUE),
  ('Chest Press Machine',   'triceps',      FALSE),
  ('Push-Up',               'chest',        TRUE),
  ('Push-Up',               'triceps',      FALSE),
  ('Push-Up',               'core',         FALSE),

  -- Rücken
  ('Deadlift',              'back',         TRUE),
  ('Deadlift',              'glutes',       TRUE),
  ('Deadlift',              'hamstrings',   FALSE),
  ('Deadlift',              'lower_back',   FALSE),
  ('Deadlift',              'traps',        FALSE),
  ('Pull-Up',               'back',         TRUE),
  ('Pull-Up',               'biceps',       FALSE),
  ('Bent-Over Row',         'back',         TRUE),
  ('Bent-Over Row',         'biceps',       FALSE),
  ('Bent-Over Row',         'lower_back',   FALSE),
  ('Dumbbell Row',          'back',         TRUE),
  ('Dumbbell Row',          'biceps',       FALSE),
  ('Lat Pulldown',          'back',         TRUE),
  ('Lat Pulldown',          'biceps',       FALSE),
  ('Seated Cable Row',      'back',         TRUE),
  ('Seated Cable Row',      'biceps',       FALSE),
  ('T-Bar Row',             'back',         TRUE),
  ('T-Bar Row',             'biceps',       FALSE),

  -- Schultern
  ('Overhead Press',        'shoulders',    TRUE),
  ('Overhead Press',        'triceps',      FALSE),
  ('Overhead Press',        'traps',        FALSE),
  ('Dumbbell Press',        'shoulders',    TRUE),
  ('Dumbbell Press',        'triceps',      FALSE),
  ('Lateral Raise',         'shoulders',    TRUE),
  ('Front Raise',           'shoulders',    TRUE),
  ('Front Raise',           'chest',        FALSE),
  ('Reverse Flye',          'shoulders',    TRUE),
  ('Reverse Flye',          'back',         FALSE),
  ('Face Pull',             'shoulders',    TRUE),
  ('Face Pull',             'traps',        FALSE),

  -- Bizeps
  ('Barbell Curl',          'biceps',       TRUE),
  ('Barbell Curl',          'forearms',     FALSE),
  ('Dumbbell Curl',         'biceps',       TRUE),
  ('Dumbbell Curl',         'forearms',     FALSE),
  ('Hammer Curl',           'biceps',       TRUE),
  ('Hammer Curl',           'forearms',     TRUE),
  ('Cable Curl',            'biceps',       TRUE),
  ('Preacher Curl',         'biceps',       TRUE),

  -- Trizeps
  ('Tricep Dip',            'triceps',      TRUE),
  ('Tricep Dip',            'chest',        FALSE),
  ('Tricep Dip',            'shoulders',    FALSE),
  ('Skull Crusher',         'triceps',      TRUE),
  ('Tricep Pushdown',       'triceps',      TRUE),
  ('Overhead Tricep Ext.',  'triceps',      TRUE),

  -- Beine
  ('Squat',                 'quadriceps',   TRUE),
  ('Squat',                 'glutes',       TRUE),
  ('Squat',                 'hamstrings',   FALSE),
  ('Squat',                 'lower_back',   FALSE),
  ('Leg Press',             'quadriceps',   TRUE),
  ('Leg Press',             'glutes',       FALSE),
  ('Leg Press',             'hamstrings',   FALSE),
  ('Leg Extension',         'quadriceps',   TRUE),
  ('Leg Curl',              'hamstrings',   TRUE),
  ('Romanian Deadlift',     'hamstrings',   TRUE),
  ('Romanian Deadlift',     'glutes',       TRUE),
  ('Romanian Deadlift',     'lower_back',   FALSE),
  ('Bulgarian Split Squat', 'quadriceps',   TRUE),
  ('Bulgarian Split Squat', 'glutes',       TRUE),
  ('Bulgarian Split Squat', 'hamstrings',   FALSE),
  ('Hip Thrust',            'glutes',       TRUE),
  ('Hip Thrust',            'hamstrings',   FALSE),
  ('Calf Raise',            'calves',       TRUE),
  ('Lunge',                 'quadriceps',   TRUE),
  ('Lunge',                 'glutes',       TRUE),
  ('Lunge',                 'hamstrings',   FALSE),

  -- Core
  ('Plank',                 'core',         TRUE),
  ('Plank',                 'glutes',       FALSE),
  ('Crunch',                'core',         TRUE),
  ('Hanging Leg Raise',     'core',         TRUE),
  ('Hanging Leg Raise',     'hip_flexors',  FALSE),
  ('Ab Wheel Rollout',      'core',         TRUE),
  ('Ab Wheel Rollout',      'lower_back',   FALSE),
  ('Russian Twist',         'core',         TRUE),
  ('Cable Crunch',          'core',         TRUE),

  -- Cardio (keine spezifischen Muskelgruppen nötig)
  ('Treadmill Run',         'quadriceps',   FALSE),
  ('Treadmill Run',         'calves',       FALSE),
  ('Rowing Machine',        'back',         FALSE),
  ('Rowing Machine',        'core',         FALSE),

  -- Dehnung (Zielmuskel)
  ('Hip Flexor Stretch',    'hip_flexors',  TRUE),
  ('Hamstring Stretch',     'hamstrings',   TRUE),
  ('Chest Stretch',         'chest',        TRUE),
  ('Shoulder Stretch',      'shoulders',    TRUE),
  ('Child''s Pose',         'lower_back',   TRUE),
  ('Child''s Pose',         'hip_flexors',  FALSE),
  ('Pigeon Pose',           'glutes',       TRUE),
  ('Pigeon Pose',           'hip_flexors',  TRUE)
) AS m(exercise_name, muscle_name, is_primary)
JOIN gym_exercises    e  ON e.name  = m.exercise_name
JOIN gym_muscle_groups mg ON mg.name = m.muscle_name
ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- Erweiterung: Breites Übungsportfolio
-- ═════════════════════════════════════════════════════════════════════════════

-- ─── Zusätzliche Muskelgruppen ───────────────────────────────────────────────

INSERT INTO gym_muscle_groups (name, name_de) VALUES
  ('adductors', 'Adduktoren'),
  ('abductors', 'Abduktoren')
ON CONFLICT (name) DO NOTHING;

-- ─── Zusätzliche Übungen ────────────────────────────────────────────────────

INSERT INTO gym_exercises (name, name_de, unilateral, equipment, tracking_type) VALUES

  -- Brust
  ('Decline Bench Press',              'Negatives Bankdrücken',              FALSE, 'BARBELL',    'REPS'),
  ('Dumbbell Bench Press',             'Kurzhantel Bankdrücken',             FALSE, 'DUMBBELL',   'REPS'),
  ('Incline Dumbbell Press',           'Schrägbank KH-Drücken',              FALSE, 'DUMBBELL',   'REPS'),
  ('Decline Dumbbell Press',           'Negatives KH-Drücken',               FALSE, 'DUMBBELL',   'REPS'),
  ('Incline Dumbbell Flye',            'Schrägbank Butterfly',               FALSE, 'DUMBBELL',   'REPS'),
  ('Pec Deck Machine',                 'Pec-Deck Maschine',                  FALSE, 'MACHINE',    'REPS'),
  ('Low-to-High Cable Flye',           'Kabelzug Crossover von unten',       FALSE, 'MACHINE',    'REPS'),

  -- Rücken
  ('Sumo Deadlift',                    'Sumo Kreuzheben',                    FALSE, 'BARBELL',    'REPS'),
  ('Trap Bar Deadlift',                'Trap-Bar Kreuzheben',                FALSE, 'BARBELL',    'REPS'),
  ('Rack Pull',                        'Rack Pull',                          FALSE, 'BARBELL',    'REPS'),
  ('Good Morning',                     'Good Morning',                       FALSE, 'BARBELL',    'REPS'),
  ('Chin-Up',                          'Untergriff-Klimmzug',                FALSE, 'BODYWEIGHT', 'REPS'),
  ('Inverted Row',                     'Australischer Klimmzug',             FALSE, 'BODYWEIGHT', 'REPS'),
  ('Pendlay Row',                      'Pendlay Row',                        FALSE, 'BARBELL',    'REPS'),
  ('Meadows Row',                      'Meadows Row',                        TRUE,  'BARBELL',    'REPS'),
  ('Chest-Supported Row',              'Brust-gestütztes Rudern',            FALSE, 'MACHINE',    'REPS'),
  ('Close-Grip Lat Pulldown',          'Latziehen enger Griff',              FALSE, 'MACHINE',    'REPS'),
  ('Straight-Arm Pulldown',            'Latziehen gestreckt',                FALSE, 'MACHINE',    'REPS'),

  -- Schultern
  ('Arnold Press',                     'Arnold Press',                       FALSE, 'DUMBBELL',   'REPS'),
  ('Machine Shoulder Press',           'Schulterdrücken Maschine',           FALSE, 'MACHINE',    'REPS'),
  ('Push Press',                       'Push Press',                         FALSE, 'BARBELL',    'REPS'),
  ('Cable Lateral Raise',              'Kabelzug Seitheben',                 TRUE,  'MACHINE',    'REPS'),
  ('Rear Delt Machine Flye',           'Hintere Schulter Maschine',          FALSE, 'MACHINE',    'REPS'),
  ('Upright Row',                      'Hochziehen',                         FALSE, 'BARBELL',    'REPS'),

  -- Bizeps
  ('EZ-Bar Curl',                      'EZ-Stangen Curl',                    FALSE, 'BARBELL',    'REPS'),
  ('Incline Dumbbell Curl',            'Schrägbank Bizepscurl',              TRUE,  'DUMBBELL',   'REPS'),
  ('Concentration Curl',               'Konzentrations-Curl',                TRUE,  'DUMBBELL',   'REPS'),
  ('Spider Curl',                      'Spider Curl',                        FALSE, 'DUMBBELL',   'REPS'),
  ('Reverse Curl',                     'Reverse Curl',                       FALSE, 'BARBELL',    'REPS'),
  ('Cable Hammer Curl',                'Kabelzug Hammer Curl',               FALSE, 'MACHINE',    'REPS'),

  -- Trizeps
  ('Close-Grip Bench Press',           'Enges Bankdrücken',                  FALSE, 'BARBELL',    'REPS'),
  ('Bench Dip',                        'Bank-Dips',                          FALSE, 'BODYWEIGHT', 'REPS'),
  ('Tricep Rope Pushdown',             'Trizeps Seil-Pushdown',              FALSE, 'MACHINE',    'REPS'),
  ('Dumbbell Kickback',                'Trizeps Kickback',                   TRUE,  'DUMBBELL',   'REPS'),
  ('Diamond Push-Up',                  'Diamant-Liegestütz',                 FALSE, 'BODYWEIGHT', 'REPS'),

  -- Beine
  ('Front Squat',                      'Frontkniebeuge',                     FALSE, 'BARBELL',    'REPS'),
  ('Sumo Squat',                       'Sumo Kniebeuge',                     FALSE, 'BARBELL',    'REPS'),
  ('Hack Squat',                       'Hack Squat',                         FALSE, 'MACHINE',    'REPS'),
  ('Goblet Squat',                     'Goblet Squat',                       FALSE, 'DUMBBELL',   'REPS'),
  ('Walking Lunge',                    'Laufender Ausfallschritt',           FALSE, 'DUMBBELL',   'REPS'),
  ('Reverse Lunge',                    'Rückwärtiger Ausfallschritt',        TRUE,  'DUMBBELL',   'REPS'),
  ('Step Up',                          'Aufsteiger',                         TRUE,  'DUMBBELL',   'REPS'),
  ('Box Jump',                         'Box Jump',                           FALSE, 'BODYWEIGHT', 'REPS'),
  ('Single-Leg Romanian Deadlift',     'Einbeiniges Rum. Kreuzheben',        TRUE,  'DUMBBELL',   'REPS'),
  ('Seated Calf Raise',                'Wadenheben sitzend',                 FALSE, 'MACHINE',    'REPS'),
  ('Leg Press Calf Raise',             'Beinpresse Wadenheben',              FALSE, 'MACHINE',    'REPS'),
  ('Nordic Curl',                      'Nordic Curl',                        FALSE, 'BODYWEIGHT', 'REPS'),
  ('Glute Kickback',                   'Gesäß Kickback',                     TRUE,  'MACHINE',    'REPS'),
  ('Abductor Machine',                 'Abduktoren Maschine',                FALSE, 'MACHINE',    'REPS'),
  ('Adductor Machine',                 'Adduktoren Maschine',                FALSE, 'MACHINE',    'REPS'),

  -- Core
  ('Side Plank',                       'Seitliche Unterarmstütz',            TRUE,  'BODYWEIGHT', 'TIME'),
  ('Bicycle Crunch',                   'Fahrrad-Crunch',                     FALSE, 'BODYWEIGHT', 'REPS'),
  ('Decline Sit-Up',                   'Schrägbank Sit-Up',                  FALSE, 'MACHINE',    'REPS'),
  ('Toe Touch Crunch',                 'Zehenberühr-Crunch',                 FALSE, 'BODYWEIGHT', 'REPS'),
  ('V-Up',                             'V-Up',                               FALSE, 'BODYWEIGHT', 'REPS'),
  ('Dragon Flag',                      'Dragon Flag',                        FALSE, 'BODYWEIGHT', 'REPS'),
  ('Hollow Body Hold',                 'Hohlkörper-Halteübung',              FALSE, 'BODYWEIGHT', 'TIME'),
  ('Dead Bug',                         'Dead Bug',                           FALSE, 'BODYWEIGHT', 'REPS'),
  ('Bird Dog',                         'Bird Dog',                           FALSE, 'BODYWEIGHT', 'REPS'),
  ('Mountain Climber',                 'Bergsteiger',                        FALSE, 'BODYWEIGHT', 'TIME'),
  ('Pallof Press',                     'Pallof Press',                       FALSE, 'MACHINE',    'REPS'),
  ('Woodchop',                         'Holzhacker',                         TRUE,  'MACHINE',    'REPS'),

  -- Cardio
  ('Sprint',                           'Sprint',                             FALSE, 'CARDIO',     'TIME'),
  ('Assault Bike',                     'Assault Bike',                       FALSE, 'CARDIO',     'TIME'),
  ('Battle Rope',                      'Battle Rope',                        FALSE, 'CARDIO',     'TIME'),
  ('Swimming',                         'Schwimmen',                          FALSE, 'CARDIO',     'TIME'),
  ('Burpee',                           'Burpee',                             FALSE, 'BODYWEIGHT', 'REPS'),

  -- Full Body / Compound
  ('Power Clean',                      'Power Clean',                        FALSE, 'BARBELL',    'REPS'),
  ('Clean and Jerk',                   'Stoßen',                             FALSE, 'BARBELL',    'REPS'),
  ('Thruster',                         'Thruster',                           FALSE, 'BARBELL',    'REPS'),
  ('Kettlebell Swing',                 'Kettlebell Swing',                   FALSE, 'DUMBBELL',   'REPS'),
  ('Turkish Get-Up',                   'Turkish Get-Up',                     TRUE,  'DUMBBELL',   'REPS'),
  ('Farmer''s Walk',                   'Farmers Walk',                       FALSE, 'DUMBBELL',   'TIME'),

  -- Dehnung
  ('Quad Stretch',                     'Quadrizeps Dehnung',                 TRUE,  'STRETCH',    'TIME'),
  ('Calf Stretch',                     'Waden Dehnung',                      TRUE,  'STRETCH',    'TIME'),
  ('Tricep Stretch',                   'Trizeps Dehnung',                    TRUE,  'STRETCH',    'TIME'),
  ('Lat Stretch',                      'Latissimus Dehnung',                 TRUE,  'STRETCH',    'TIME'),
  ('Lower Back Stretch',               'Unterer Rücken Dehnung',             FALSE, 'STRETCH',    'TIME'),
  ('Doorway Chest Stretch',            'Türrahmen-Brustdehnung',             FALSE, 'STRETCH',    'TIME'),
  ('Glute Stretch',                    'Gesäß Dehnung',                      TRUE,  'STRETCH',    'TIME'),
  ('IT Band Stretch',                  'IT-Band Dehnung',                    TRUE,  'STRETCH',    'TIME'),
  ('Spinal Twist',                     'Wirbelsäulendrehung',                TRUE,  'STRETCH',    'TIME'),
  ('Seated Forward Fold',              'Sitzende Vorbeuge',                  FALSE, 'STRETCH',    'TIME'),
  ('Cat-Cow',                          'Katze-Kuh',                          FALSE, 'STRETCH',    'TIME'),
  ('World''s Greatest Stretch',        'World Greatest Stretch',             TRUE,  'STRETCH',    'TIME')

ON CONFLICT (name) DO NOTHING;

-- ─── Muskelgruppen-Zuordnungen (Erweiterung) ────────────────────────────────

INSERT INTO gym_exercise_muscle_groups (exercise_id, muscle_group_id, is_primary)
SELECT e.id, mg.id, m.is_primary
FROM (VALUES

  -- Brust
  ('Decline Bench Press',              'chest',        TRUE),
  ('Decline Bench Press',              'triceps',      FALSE),
  ('Decline Bench Press',              'shoulders',    FALSE),
  ('Dumbbell Bench Press',             'chest',        TRUE),
  ('Dumbbell Bench Press',             'triceps',      FALSE),
  ('Dumbbell Bench Press',             'shoulders',    FALSE),
  ('Incline Dumbbell Press',           'chest',        TRUE),
  ('Incline Dumbbell Press',           'shoulders',    FALSE),
  ('Incline Dumbbell Press',           'triceps',      FALSE),
  ('Decline Dumbbell Press',           'chest',        TRUE),
  ('Decline Dumbbell Press',           'triceps',      FALSE),
  ('Incline Dumbbell Flye',            'chest',        TRUE),
  ('Incline Dumbbell Flye',            'shoulders',    FALSE),
  ('Pec Deck Machine',                 'chest',        TRUE),
  ('Low-to-High Cable Flye',           'chest',        TRUE),

  -- Rücken
  ('Sumo Deadlift',                    'back',         TRUE),
  ('Sumo Deadlift',                    'glutes',       TRUE),
  ('Sumo Deadlift',                    'hamstrings',   FALSE),
  ('Sumo Deadlift',                    'lower_back',   FALSE),
  ('Sumo Deadlift',                    'adductors',    FALSE),
  ('Trap Bar Deadlift',                'back',         TRUE),
  ('Trap Bar Deadlift',                'glutes',       TRUE),
  ('Trap Bar Deadlift',                'quadriceps',   FALSE),
  ('Trap Bar Deadlift',                'hamstrings',   FALSE),
  ('Rack Pull',                        'back',         TRUE),
  ('Rack Pull',                        'traps',        TRUE),
  ('Rack Pull',                        'lower_back',   FALSE),
  ('Good Morning',                     'hamstrings',   TRUE),
  ('Good Morning',                     'lower_back',   TRUE),
  ('Good Morning',                     'glutes',       FALSE),
  ('Chin-Up',                          'back',         TRUE),
  ('Chin-Up',                          'biceps',       TRUE),
  ('Inverted Row',                     'back',         TRUE),
  ('Inverted Row',                     'biceps',       FALSE),
  ('Inverted Row',                     'core',         FALSE),
  ('Pendlay Row',                      'back',         TRUE),
  ('Pendlay Row',                      'biceps',       FALSE),
  ('Pendlay Row',                      'lower_back',   FALSE),
  ('Meadows Row',                      'back',         TRUE),
  ('Meadows Row',                      'biceps',       FALSE),
  ('Chest-Supported Row',              'back',         TRUE),
  ('Chest-Supported Row',              'biceps',       FALSE),
  ('Close-Grip Lat Pulldown',          'back',         TRUE),
  ('Close-Grip Lat Pulldown',          'biceps',       FALSE),
  ('Straight-Arm Pulldown',            'back',         TRUE),

  -- Schultern
  ('Arnold Press',                     'shoulders',    TRUE),
  ('Arnold Press',                     'triceps',      FALSE),
  ('Machine Shoulder Press',           'shoulders',    TRUE),
  ('Machine Shoulder Press',           'triceps',      FALSE),
  ('Push Press',                       'shoulders',    TRUE),
  ('Push Press',                       'triceps',      FALSE),
  ('Push Press',                       'lower_back',   FALSE),
  ('Cable Lateral Raise',              'shoulders',    TRUE),
  ('Rear Delt Machine Flye',           'shoulders',    TRUE),
  ('Rear Delt Machine Flye',           'back',         FALSE),
  ('Upright Row',                      'shoulders',    TRUE),
  ('Upright Row',                      'traps',        TRUE),
  ('Upright Row',                      'biceps',       FALSE),

  -- Bizeps
  ('EZ-Bar Curl',                      'biceps',       TRUE),
  ('EZ-Bar Curl',                      'forearms',     FALSE),
  ('Incline Dumbbell Curl',            'biceps',       TRUE),
  ('Incline Dumbbell Curl',            'forearms',     FALSE),
  ('Concentration Curl',               'biceps',       TRUE),
  ('Spider Curl',                      'biceps',       TRUE),
  ('Reverse Curl',                     'forearms',     TRUE),
  ('Reverse Curl',                     'biceps',       FALSE),
  ('Cable Hammer Curl',                'biceps',       TRUE),
  ('Cable Hammer Curl',                'forearms',     FALSE),

  -- Trizeps
  ('Close-Grip Bench Press',           'triceps',      TRUE),
  ('Close-Grip Bench Press',           'chest',        FALSE),
  ('Close-Grip Bench Press',           'shoulders',    FALSE),
  ('Bench Dip',                        'triceps',      TRUE),
  ('Bench Dip',                        'chest',        FALSE),
  ('Bench Dip',                        'shoulders',    FALSE),
  ('Tricep Rope Pushdown',             'triceps',      TRUE),
  ('Dumbbell Kickback',                'triceps',      TRUE),
  ('Diamond Push-Up',                  'triceps',      TRUE),
  ('Diamond Push-Up',                  'chest',        FALSE),

  -- Beine
  ('Front Squat',                      'quadriceps',   TRUE),
  ('Front Squat',                      'glutes',       FALSE),
  ('Front Squat',                      'core',         FALSE),
  ('Sumo Squat',                       'glutes',       TRUE),
  ('Sumo Squat',                       'quadriceps',   TRUE),
  ('Sumo Squat',                       'adductors',    FALSE),
  ('Hack Squat',                       'quadriceps',   TRUE),
  ('Hack Squat',                       'glutes',       FALSE),
  ('Goblet Squat',                     'quadriceps',   TRUE),
  ('Goblet Squat',                     'glutes',       FALSE),
  ('Goblet Squat',                     'core',         FALSE),
  ('Walking Lunge',                    'quadriceps',   TRUE),
  ('Walking Lunge',                    'glutes',       TRUE),
  ('Walking Lunge',                    'hamstrings',   FALSE),
  ('Reverse Lunge',                    'quadriceps',   TRUE),
  ('Reverse Lunge',                    'glutes',       TRUE),
  ('Reverse Lunge',                    'hamstrings',   FALSE),
  ('Step Up',                          'quadriceps',   TRUE),
  ('Step Up',                          'glutes',       TRUE),
  ('Step Up',                          'hamstrings',   FALSE),
  ('Box Jump',                         'quadriceps',   TRUE),
  ('Box Jump',                         'glutes',       TRUE),
  ('Box Jump',                         'calves',       FALSE),
  ('Single-Leg Romanian Deadlift',     'hamstrings',   TRUE),
  ('Single-Leg Romanian Deadlift',     'glutes',       TRUE),
  ('Single-Leg Romanian Deadlift',     'lower_back',   FALSE),
  ('Seated Calf Raise',                'calves',       TRUE),
  ('Leg Press Calf Raise',             'calves',       TRUE),
  ('Nordic Curl',                      'hamstrings',   TRUE),
  ('Glute Kickback',                   'glutes',       TRUE),
  ('Glute Kickback',                   'hamstrings',   FALSE),
  ('Abductor Machine',                 'abductors',    TRUE),
  ('Adductor Machine',                 'adductors',    TRUE),

  -- Core
  ('Side Plank',                       'core',         TRUE),
  ('Bicycle Crunch',                   'core',         TRUE),
  ('Decline Sit-Up',                   'core',         TRUE),
  ('Decline Sit-Up',                   'hip_flexors',  FALSE),
  ('Toe Touch Crunch',                 'core',         TRUE),
  ('V-Up',                             'core',         TRUE),
  ('V-Up',                             'hip_flexors',  FALSE),
  ('Dragon Flag',                      'core',         TRUE),
  ('Hollow Body Hold',                 'core',         TRUE),
  ('Dead Bug',                         'core',         TRUE),
  ('Bird Dog',                         'core',         TRUE),
  ('Bird Dog',                         'lower_back',   FALSE),
  ('Mountain Climber',                 'core',         TRUE),
  ('Mountain Climber',                 'hip_flexors',  FALSE),
  ('Pallof Press',                     'core',         TRUE),
  ('Woodchop',                         'core',         TRUE),

  -- Cardio
  ('Sprint',                           'quadriceps',   FALSE),
  ('Sprint',                           'hamstrings',   FALSE),
  ('Sprint',                           'calves',       FALSE),
  ('Assault Bike',                     'quadriceps',   FALSE),
  ('Assault Bike',                     'calves',       FALSE),
  ('Battle Rope',                      'shoulders',    FALSE),
  ('Battle Rope',                      'core',         FALSE),
  ('Swimming',                         'back',         FALSE),
  ('Swimming',                         'shoulders',    FALSE),
  ('Swimming',                         'core',         FALSE),
  ('Burpee',                           'core',         FALSE),
  ('Burpee',                           'quadriceps',   FALSE),
  ('Burpee',                           'chest',        FALSE),

  -- Full Body / Compound
  ('Power Clean',                      'back',         TRUE),
  ('Power Clean',                      'traps',        TRUE),
  ('Power Clean',                      'glutes',       FALSE),
  ('Power Clean',                      'hamstrings',   FALSE),
  ('Clean and Jerk',                   'back',         TRUE),
  ('Clean and Jerk',                   'traps',        TRUE),
  ('Clean and Jerk',                   'shoulders',    TRUE),
  ('Clean and Jerk',                   'glutes',       FALSE),
  ('Thruster',                         'shoulders',    TRUE),
  ('Thruster',                         'quadriceps',   TRUE),
  ('Thruster',                         'glutes',       FALSE),
  ('Thruster',                         'triceps',      FALSE),
  ('Kettlebell Swing',                 'glutes',       TRUE),
  ('Kettlebell Swing',                 'hamstrings',   TRUE),
  ('Kettlebell Swing',                 'lower_back',   FALSE),
  ('Kettlebell Swing',                 'core',         FALSE),
  ('Turkish Get-Up',                   'shoulders',    TRUE),
  ('Turkish Get-Up',                   'core',         TRUE),
  ('Turkish Get-Up',                   'glutes',       FALSE),
  ('Farmer''s Walk',                   'forearms',     TRUE),
  ('Farmer''s Walk',                   'traps',        TRUE),
  ('Farmer''s Walk',                   'core',         FALSE),

  -- Dehnung
  ('Quad Stretch',                     'quadriceps',   TRUE),
  ('Quad Stretch',                     'hip_flexors',  FALSE),
  ('Calf Stretch',                     'calves',       TRUE),
  ('Tricep Stretch',                   'triceps',      TRUE),
  ('Lat Stretch',                      'back',         TRUE),
  ('Lower Back Stretch',               'lower_back',   TRUE),
  ('Doorway Chest Stretch',            'chest',        TRUE),
  ('Doorway Chest Stretch',            'shoulders',    FALSE),
  ('Glute Stretch',                    'glutes',       TRUE),
  ('IT Band Stretch',                  'hip_flexors',  TRUE),
  ('Spinal Twist',                     'lower_back',   TRUE),
  ('Seated Forward Fold',              'hamstrings',   TRUE),
  ('Seated Forward Fold',              'lower_back',   FALSE),
  ('Cat-Cow',                          'lower_back',   TRUE),
  ('Cat-Cow',                          'core',         FALSE),
  ('World''s Greatest Stretch',        'hip_flexors',  TRUE),
  ('World''s Greatest Stretch',        'quadriceps',   FALSE),
  ('World''s Greatest Stretch',        'lower_back',   FALSE)

) AS m(exercise_name, muscle_name, is_primary)
JOIN gym_exercises     e  ON e.name  = m.exercise_name
JOIN gym_muscle_groups mg ON mg.name = m.muscle_name
ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING;
