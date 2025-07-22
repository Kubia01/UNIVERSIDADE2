-- Função RPC para contornar problemas de RLS ao carregar perfis
-- Esta função executa com privilégios de service_role

CREATE OR REPLACE FUNCTION get_all_profiles()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  department text,
  role text,
  avatar text,
  created_at timestamptz,
  updated_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Esta função executa com privilégios elevados, ignorando RLS
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.email,
    p.department,
    p.role,
    p.avatar,
    p.created_at,
    p.updated_at
  FROM profiles p
  ORDER BY p.name ASC;
END;
$$;

-- Permitir que usuários autenticados executem esta função
GRANT EXECUTE ON FUNCTION get_all_profiles() TO authenticated;

-- Testar a função
SELECT 'Função RPC criada com sucesso!' as status;
SELECT * FROM get_all_profiles() LIMIT 3;
