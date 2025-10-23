-- Update the handle_new_user function to also create company_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_user_type public.user_type;
BEGIN
  -- Get user type from metadata, default to 'talent'
  v_user_type := COALESCE(new.raw_user_meta_data->>'user_type', 'talent')::public.user_type;
  
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, user_type)
  VALUES (
    new.id,
    new.email,
    v_user_type
  );
  
  -- If user_type is 'company', also create a company_profiles entry
  IF v_user_type = 'company' THEN
    INSERT INTO public.company_profiles (
      user_id,
      company_name,
      description
    )
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', 'Company'),
      'Company profile created automatically'
    );
  END IF;
  
  RETURN new;
END;
$function$;