-- Unmasked: the database (PostgreSQL 17, plain SQL, no ORM).
--
-- How it is organised
--   * Every piece of content (a body part, a signal, a muscle, a test question...) is one row.
--     Its words live in a matching *_texts table, one row per language (English, Kurdish Sorani),
--     so adding a language never changes a table, it only adds rows.
--   * Five groups: languages and evidence levels; the Map; the Mirror; the tests; visitors.
--   * Visitors have no accounts and no names: the browser makes a random id and keeps it. Their
--     rehearsals and test answers are the tables that grow.
--   * The rules live in the database too: constraints, one trigger that checks every answer, one that
--     closes a test attempt when the last question is answered, and views the website reads.

-- ── Languages and evidence ─────────────────────────────────────────────────────────────────────────

CREATE TABLE languages (
  code        text PRIMARY KEY CHECK (code ~ '^[a-z]{2,3}$'),
  name        text NOT NULL,
  native_name text NOT NULL,
  direction   text NOT NULL CHECK (direction IN ('ltr', 'rtl')),
  position    smallint NOT NULL UNIQUE
);

-- How well the research supports a claim: solid, mixed, weak.
CREATE TABLE evidence_levels (
  code text PRIMARY KEY,
  rank smallint NOT NULL UNIQUE CHECK (rank BETWEEN 1 AND 3)   -- 3 = strongest
);

CREATE TABLE evidence_level_texts (
  level_code text REFERENCES evidence_levels ON DELETE CASCADE,
  lang       text REFERENCES languages,
  label      text NOT NULL,
  PRIMARY KEY (level_code, lang)
);

-- ── The Map ────────────────────────────────────────────────────────────────────────────────────────

-- The parts of the body. Brows, eyes, mouth and skin belong to the head (parent_id).
CREATE TABLE body_parts (
  id        smallint PRIMARY KEY,
  slug      text NOT NULL UNIQUE CHECK (slug ~ '^[a-z-]+$'),
  parent_id smallint REFERENCES body_parts ON DELETE SET NULL,
  position  smallint NOT NULL UNIQUE,
  CHECK (parent_id IS DISTINCT FROM id)
);

CREATE TABLE body_part_texts (
  body_part_id smallint REFERENCES body_parts ON DELETE CASCADE,
  lang         text REFERENCES languages,
  name         text NOT NULL,
  short_name   text NOT NULL,
  line         text NOT NULL,     -- the one-line description under the name
  feels        text NOT NULL,     -- what this part feels from the inside
  PRIMARY KEY (body_part_id, lang)
);

-- What a part of the body says to other people, with the context that changes the reading.
CREATE TABLE signals (
  id           integer PRIMARY KEY,
  body_part_id smallint NOT NULL REFERENCES body_parts ON DELETE CASCADE,
  position     smallint NOT NULL,
  evidence     text NOT NULL REFERENCES evidence_levels,
  UNIQUE (body_part_id, position)
);

CREATE TABLE signal_texts (
  signal_id integer REFERENCES signals ON DELETE CASCADE,
  lang      text REFERENCES languages,
  tell      text NOT NULL,       -- what you see
  means     text NOT NULL,       -- what it usually means
  context   text NOT NULL,       -- what else it can mean, and when
  PRIMARY KEY (signal_id, lang)
);

-- Feelings and where in the body people feel them (body-mapping research, Nummenmaa et al. 2014).
CREATE TABLE feelings (
  id       smallint PRIMARY KEY,
  slug     text NOT NULL UNIQUE CHECK (slug ~ '^[a-z-]+$'),
  position smallint NOT NULL UNIQUE
);

CREATE TABLE feeling_texts (
  feeling_id smallint REFERENCES feelings ON DELETE CASCADE,
  lang       text REFERENCES languages,
  name       text NOT NULL,
  note       text NOT NULL,
  PRIMARY KEY (feeling_id, lang)
);

-- -3 (felt as cold, numb) to 3 (felt strongly, hot). A part with no row is felt as neither.
CREATE TABLE feeling_heat (
  feeling_id   smallint REFERENCES feelings ON DELETE CASCADE,
  body_part_id smallint REFERENCES body_parts ON DELETE CASCADE,
  heat         smallint NOT NULL CHECK (heat BETWEEN -3 AND 3),
  PRIMARY KEY (feeling_id, body_part_id)
);

-- ── The Mirror ─────────────────────────────────────────────────────────────────────────────────────

-- The muscles the Mirror reads, as action units of the Facial Action Coding System (Ekman et al.).
CREATE TABLE action_units (
  au       smallint PRIMARY KEY CHECK (au BETWEEN 1 AND 99),
  muscle   text NOT NULL,     -- the Latin name, the same in every language
  zone     text NOT NULL CHECK (zone IN ('brows', 'eyes', 'nose', 'mouth')),
  position smallint NOT NULL UNIQUE
);

CREATE TABLE action_unit_texts (
  au    smallint REFERENCES action_units ON DELETE CASCADE,
  lang  text REFERENCES languages,
  name  text NOT NULL,        -- the FACS name, e.g. Cheek raiser
  plain text NOT NULL,        -- in plain words, e.g. Cheeks lifted, eye corners crinkled
  PRIMARY KEY (au, lang)
);

-- Expressions to perform on demand.
CREATE TABLE expressions (
  id       smallint PRIMARY KEY,
  slug     text NOT NULL UNIQUE CHECK (slug ~ '^[a-z-]+$'),
  position smallint NOT NULL UNIQUE
);

CREATE TABLE expression_texts (
  expression_id smallint REFERENCES expressions ON DELETE CASCADE,
  lang          text REFERENCES languages,
  name          text NOT NULL,
  hint          text NOT NULL,
  PRIMARY KEY (expression_id, lang)
);

-- Which muscles an expression needs (and how much, 0 to 1) and which must stay still.
CREATE TABLE expression_units (
  expression_id smallint REFERENCES expressions ON DELETE CASCADE,
  au            smallint REFERENCES action_units,
  role          text NOT NULL CHECK (role IN ('need', 'avoid')),
  level         numeric(3, 2) CHECK (level > 0 AND level <= 1),
  PRIMARY KEY (expression_id, au),
  CHECK ((role = 'need') = (level IS NOT NULL))   -- a needed muscle has a level, one to avoid has none
);

-- Poker face: lines that try to provoke a reaction.
CREATE TABLE poker_prompts (
  id       smallint PRIMARY KEY,
  position smallint NOT NULL UNIQUE
);

CREATE TABLE poker_prompt_texts (
  prompt_id smallint REFERENCES poker_prompts ON DELETE CASCADE,
  lang      text REFERENCES languages,
  text      text NOT NULL,
  PRIMARY KEY (prompt_id, lang)
);

-- Rehearse: the situations, and the measures on the report.
CREATE TABLE scenarios (
  id       smallint PRIMARY KEY,
  slug     text NOT NULL UNIQUE CHECK (slug ~ '^[a-z-]+$'),
  position smallint NOT NULL UNIQUE
);

CREATE TABLE scenario_texts (
  scenario_id smallint REFERENCES scenarios ON DELETE CASCADE,
  lang        text REFERENCES languages,
  name        text NOT NULL,
  prompt      text NOT NULL,
  PRIMARY KEY (scenario_id, lang)
);

CREATE TABLE report_measures (
  slug     text PRIMARY KEY CHECK (slug ~ '^[a-z-]+$'),
  evidence text NOT NULL REFERENCES evidence_levels,
  position smallint NOT NULL UNIQUE
);

CREATE TABLE report_measure_texts (
  measure text REFERENCES report_measures ON DELETE CASCADE,
  lang    text REFERENCES languages,
  title   text NOT NULL,
  reading text NOT NULL,      -- what people tend to read into it
  PRIMARY KEY (measure, lang)
);

-- ── The tests ──────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE tests (
  id       smallint PRIMARY KEY,
  slug     text NOT NULL UNIQUE CHECK (slug ~ '^[a-z-]+$'),
  kind     text NOT NULL CHECK (kind IN ('eyes', 'body', 'context')),
  position smallint NOT NULL UNIQUE
);

CREATE TABLE test_texts (
  test_id smallint REFERENCES tests ON DELETE CASCADE,
  lang    text REFERENCES languages,
  name    text NOT NULL,
  kicker  text NOT NULL,
  blurb   text NOT NULL,
  PRIMARY KEY (test_id, lang)
);

CREATE TABLE questions (
  id          integer PRIMARY KEY,
  test_id     smallint NOT NULL REFERENCES tests ON DELETE CASCADE,
  slug        text NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  position    smallint NOT NULL,
  photo_file  text NOT NULL,      -- e.g. images/eyes/suspicious (the site tries .jpg, .jpeg, .png, .webp)
  photo_who   text NOT NULL DEFAULT '',
  photo_frame jsonb CHECK (photo_frame IS NULL OR jsonb_typeof(photo_frame) = 'object'),  -- crop / veil
  pose        text,               -- context test: the drawn silhouette shown until a photo exists
  scene       text,
  UNIQUE (test_id, slug),
  UNIQUE (test_id, position)
);

CREATE TABLE question_texts (
  question_id integer REFERENCES questions ON DELETE CASCADE,
  lang        text REFERENCES languages,
  prompt      text NOT NULL,
  title       text NOT NULL,       -- the name of the right answer's reading
  cue         text NOT NULL,       -- what to look at
  why         text NOT NULL,       -- why the near-misses are near-misses
  place       text,                -- context test: where the scene is
  credit      text NOT NULL DEFAULT '',
  PRIMARY KEY (question_id, lang)
);

CREATE TABLE options (
  id          integer PRIMARY KEY,
  question_id integer NOT NULL REFERENCES questions ON DELETE CASCADE,
  position    smallint NOT NULL CHECK (position BETWEEN 1 AND 6),
  is_correct  boolean NOT NULL DEFAULT false,
  UNIQUE (question_id, position)
);

-- At most one right answer per question (the seed check below makes sure there is at least one).
CREATE UNIQUE INDEX one_correct_option ON options (question_id) WHERE is_correct;

CREATE TABLE option_texts (
  option_id integer REFERENCES options ON DELETE CASCADE,
  lang      text REFERENCES languages,
  label     text NOT NULL,
  PRIMARY KEY (option_id, lang)
);

-- ── Visitors and what they do ──────────────────────────────────────────────────────────────────────

CREATE TABLE visitors (
  id         uuid PRIMARY KEY,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen  timestamptz NOT NULL DEFAULT now(),
  lang       text NOT NULL DEFAULT 'en' REFERENCES languages
);

-- One Rehearse report. Only numbers: no video, no sound, no picture is ever stored.
CREATE TABLE rehearsals (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  visitor_id     uuid NOT NULL REFERENCES visitors ON DELETE CASCADE,
  scenario_id    smallint NOT NULL REFERENCES scenarios,
  recorded_at    timestamptz NOT NULL DEFAULT now(),
  seconds        numeric(4, 1) NOT NULL CHECK (seconds > 0 AND seconds <= 120),
  face_share     smallint NOT NULL CHECK (face_share BETWEEN 0 AND 100),
  blinks_per_min smallint NOT NULL CHECK (blinks_per_min BETWEEN 0 AND 400),
  smiles         smallint NOT NULL CHECK (smiles >= 0),
  smiles_eyes    smallint NOT NULL CHECK (smiles_eyes >= 0 AND smiles_eyes <= smiles),
  presses        smallint NOT NULL CHECK (presses >= 0),
  brow_up        smallint NOT NULL CHECK (brow_up BETWEEN 0 AND 100),
  brow_down      smallint NOT NULL CHECK (brow_down BETWEEN 0 AND 100),
  still          smallint NOT NULL CHECK (still BETWEEN 0 AND 100),
  tilt           smallint NOT NULL CHECK (tilt BETWEEN 0 AND 100)
);
CREATE INDEX rehearsals_by_visitor ON rehearsals (visitor_id, scenario_id, recorded_at DESC);

CREATE TABLE test_attempts (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  visitor_id  uuid NOT NULL REFERENCES visitors ON DELETE CASCADE,
  test_id     smallint NOT NULL REFERENCES tests,
  lang        text NOT NULL REFERENCES languages,
  started_at  timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  CHECK (finished_at IS NULL OR finished_at >= started_at)
);
CREATE INDEX attempts_by_visitor ON test_attempts (visitor_id, test_id);

CREATE TABLE attempt_answers (
  attempt_id  bigint REFERENCES test_attempts ON DELETE CASCADE,
  question_id integer REFERENCES questions,
  option_id   integer NOT NULL REFERENCES options,
  answered_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (attempt_id, question_id)
);
CREATE INDEX answers_by_question ON attempt_answers (question_id);

-- ── Rules in the database ──────────────────────────────────────────────────────────────────────────

-- An answer must be one of that question's options, the question must be in the attempt's test, and a
-- finished attempt takes no more answers. Checked here, so no client can store a nonsense answer.
CREATE FUNCTION check_answer() RETURNS trigger LANGUAGE plpgsql AS $fn$
DECLARE
  attempt record;
BEGIN
  SELECT test_id, finished_at INTO attempt FROM test_attempts WHERE id = NEW.attempt_id;
  IF attempt.finished_at IS NOT NULL THEN
    RAISE EXCEPTION 'attempt % is already finished', NEW.attempt_id USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM questions WHERE id = NEW.question_id AND test_id = attempt.test_id) THEN
    RAISE EXCEPTION 'question % is not in this test', NEW.question_id USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM options WHERE id = NEW.option_id AND question_id = NEW.question_id) THEN
    RAISE EXCEPTION 'option % does not belong to question %', NEW.option_id, NEW.question_id USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$fn$;

CREATE TRIGGER answers_are_checked BEFORE INSERT OR UPDATE ON attempt_answers
  FOR EACH ROW EXECUTE FUNCTION check_answer();

-- When the last question of a test is answered, the attempt is finished.
CREATE FUNCTION finish_attempt() RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
  UPDATE test_attempts a SET finished_at = now()
  WHERE a.id = NEW.attempt_id AND a.finished_at IS NULL
    AND (SELECT count(*) FROM attempt_answers WHERE attempt_id = a.id)
      = (SELECT count(*) FROM questions WHERE test_id = a.test_id);
  RETURN NULL;
END
$fn$;

CREATE TRIGGER attempts_finish AFTER INSERT ON attempt_answers
  FOR EACH ROW EXECUTE FUNCTION finish_attempt();

-- Whatever a visitor does, they were last seen now.
CREATE FUNCTION touch_visitor() RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
  UPDATE visitors SET last_seen = now() WHERE id = NEW.visitor_id;
  RETURN NULL;
END
$fn$;

CREATE TRIGGER rehearsals_touch AFTER INSERT ON rehearsals FOR EACH ROW EXECUTE FUNCTION touch_visitor();
CREATE TRIGGER attempts_touch AFTER INSERT ON test_attempts FOR EACH ROW EXECUTE FUNCTION touch_visitor();

-- ── Views the website reads ────────────────────────────────────────────────────────────────────────

-- Each test attempt with its score.
CREATE VIEW attempt_scores AS
SELECT a.id AS attempt_id, a.visitor_id, t.slug AS test, a.lang, a.started_at, a.finished_at,
       count(aa.question_id) AS answered,
       count(*) FILTER (WHERE o.is_correct) AS correct,
       (SELECT count(*) FROM questions q WHERE q.test_id = a.test_id) AS total
FROM test_attempts a
JOIN tests t ON t.id = a.test_id
LEFT JOIN attempt_answers aa ON aa.attempt_id = a.id
LEFT JOIN options o ON o.id = aa.option_id
GROUP BY a.id, t.slug;

-- How everyone did on each question: how many answered, and how many got it right.
CREATE VIEW question_stats AS
SELECT q.id AS question_id, t.slug AS test, q.slug AS question,
       count(aa.option_id) AS answers,
       count(*) FILTER (WHERE o.is_correct) AS correct,
       round(100.0 * count(*) FILTER (WHERE o.is_correct) / NULLIF(count(aa.option_id), 0)) AS percent_correct
FROM questions q
JOIN tests t ON t.id = q.test_id
LEFT JOIN attempt_answers aa ON aa.question_id = q.id
LEFT JOIN options o ON o.id = aa.option_id
GROUP BY q.id, t.slug, q.slug;

-- How often each option was picked, so the site can say "34% of people chose this".
CREATE VIEW option_picks AS
SELECT o.question_id, o.id AS option_id, o.position, o.is_correct,
       count(aa.attempt_id) AS picks,
       round(100.0 * count(aa.attempt_id) / NULLIF(sum(count(aa.attempt_id)) OVER (PARTITION BY o.question_id), 0)) AS percent
FROM options o
LEFT JOIN attempt_answers aa ON aa.option_id = o.id
GROUP BY o.id;

-- Every rehearsal next to the one before it (same visitor, same situation), to show progress.
CREATE VIEW rehearsal_progress AS
SELECT r.*, s.slug AS scenario,
       lag(r.blinks_per_min) OVER w AS prev_blinks_per_min,
       lag(r.smiles) OVER w AS prev_smiles,
       lag(r.smiles_eyes) OVER w AS prev_smiles_eyes,
       lag(r.presses) OVER w AS prev_presses,
       lag(r.brow_up) OVER w AS prev_brow_up,
       lag(r.still) OVER w AS prev_still,
       lag(r.tilt) OVER w AS prev_tilt,
       row_number() OVER w AS attempt_number
FROM rehearsals r
JOIN scenarios s ON s.id = r.scenario_id
WINDOW w AS (PARTITION BY r.visitor_id, r.scenario_id ORDER BY r.recorded_at, r.id);

-- How much is in the database (for the health check and the presentation).
CREATE VIEW content_counts AS
SELECT (SELECT count(*) FROM body_parts) AS body_parts,
       (SELECT count(*) FROM signals) AS signals,
       (SELECT count(*) FROM feelings) AS feelings,
       (SELECT count(*) FROM action_units) AS action_units,
       (SELECT count(*) FROM expressions) AS expressions,
       (SELECT count(*) FROM scenarios) AS scenarios,
       (SELECT count(*) FROM tests) AS tests,
       (SELECT count(*) FROM questions) AS questions,
       (SELECT count(*) FROM options) AS options,
       (SELECT count(*) FROM visitors) AS visitors,
       (SELECT count(*) FROM rehearsals) AS rehearsals,
       (SELECT count(*) FROM test_attempts) AS test_attempts,
       (SELECT count(*) FROM attempt_answers) AS answers;
