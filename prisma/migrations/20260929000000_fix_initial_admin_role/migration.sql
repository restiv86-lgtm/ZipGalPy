DO $$
DECLARE
  target_user_id TEXT;
  target_count INTEGER;
BEGIN
  SELECT COUNT(*), MIN("id")
  INTO target_count, target_user_id
  FROM "users"
  WHERE LOWER(BTRIM("email")) = 'restiv@naver.com';

  IF target_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one initial admin account, found %', target_count;
  END IF;

  UPDATE "users"
  SET "role" = 'ADMIN'
  WHERE "id" = target_user_id;
END $$;
