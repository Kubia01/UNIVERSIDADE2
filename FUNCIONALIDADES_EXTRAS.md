# 🚀 Funcionalidades Extras - Universidade Corporativa

Este documento contém funcionalidades adicionais que você pode implementar no seu sistema de universidade corporativa para torná-lo ainda mais completo e útil para sua empresa.

## 📊 Relatórios e Analytics

### 1. Dashboard de Administrador
```sql
-- View para estatísticas gerais
CREATE VIEW admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE role = 'user') as total_users,
  (SELECT COUNT(*) FROM courses WHERE is_published = true) as published_courses,
  (SELECT COUNT(*) FROM user_progress WHERE completed = true) as completed_courses,
  (SELECT COUNT(*) FROM certificates) as certificates_issued;
```

### 2. Relatório de Progresso por Departamento
```sql
-- View para progresso por departamento
CREATE VIEW department_progress AS
SELECT 
  p.department,
  COUNT(DISTINCT p.id) as total_users,
  COUNT(DISTINCT up.course_id) as courses_started,
  COUNT(DISTINCT CASE WHEN up.completed = true THEN up.course_id END) as courses_completed,
  ROUND(AVG(up.progress_percentage), 2) as avg_progress
FROM profiles p
LEFT JOIN user_progress up ON p.id = up.user_id
WHERE p.role = 'user'
GROUP BY p.department;
```

### 3. Usuários Mais Ativos
```sql
-- View para usuários mais ativos
CREATE VIEW most_active_users AS
SELECT 
  p.name,
  p.email,
  p.department,
  COUNT(DISTINCT up.course_id) as courses_started,
  COUNT(DISTINCT CASE WHEN up.completed = true THEN up.course_id END) as courses_completed,
  SUM(CASE WHEN up.completed = true THEN c.duration ELSE 0 END) as total_study_time
FROM profiles p
LEFT JOIN user_progress up ON p.id = up.user_id
LEFT JOIN courses c ON up.course_id = c.id
WHERE p.role = 'user'
GROUP BY p.id, p.name, p.email, p.department
ORDER BY courses_completed DESC, total_study_time DESC
LIMIT 10;
```

## 🎮 Gamificação

### 1. Sistema de Pontos
```sql
-- Tabela de pontos
CREATE TABLE user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  points INTEGER DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para dar pontos ao completar vídeo
CREATE OR REPLACE FUNCTION award_points_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND OLD.completed = false THEN
    INSERT INTO user_points (user_id, points, reason)
    VALUES (NEW.user_id, 10, 'Vídeo concluído');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER award_points_trigger
  AFTER UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION award_points_on_completion();
```

### 2. Sistema de Badges
```sql
-- Tabela de badges
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  criteria JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de badges dos usuários
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  badge_id UUID REFERENCES badges(id),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Inserir badges padrão
INSERT INTO badges (name, description, icon, criteria) VALUES
('Primeiro Passo', 'Completou o primeiro curso', '🎯', '{"type": "courses_completed", "value": 1}'),
('Estudioso', 'Completou 5 cursos', '📚', '{"type": "courses_completed", "value": 5}'),
('Expert', 'Completou 10 cursos', '🏆', '{"type": "courses_completed", "value": 10}'),
('Maratonista', 'Assistiu 10 horas de vídeo', '⏰', '{"type": "study_time", "value": 36000}');
```

## 📱 Notificações

### 1. Notificações por Email
```sql
-- Tabela de notificações
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para criar notificação
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (p_user_id, p_title, p_message, p_type)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;
```

### 2. Lembrete de Cursos Não Concluídos
```sql
-- View para cursos não concluídos
CREATE VIEW incomplete_courses AS
SELECT 
  p.id as user_id,
  p.email,
  p.name,
  c.title as course_title,
  up.last_watched_at,
  up.progress_percentage
FROM profiles p
JOIN user_progress up ON p.id = up.user_id
JOIN courses c ON up.course_id = c.id
WHERE up.completed = false
AND up.last_watched_at < NOW() - INTERVAL '7 days'
AND p.role = 'user';
```

## 🔍 Busca Avançada

### 1. Busca por Conteúdo
```sql
-- Adicionar índice de busca
CREATE INDEX idx_courses_search ON courses USING gin(to_tsvector('portuguese', title || ' ' || description));
CREATE INDEX idx_videos_search ON videos USING gin(to_tsvector('portuguese', title || ' ' || description));

-- Função de busca
CREATE OR REPLACE FUNCTION search_content(search_term TEXT)
RETURNS TABLE (
  type TEXT,
  id UUID,
  title TEXT,
  description TEXT,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'course'::TEXT as type,
    c.id,
    c.title,
    c.description,
    ts_rank(to_tsvector('portuguese', c.title || ' ' || c.description), plainto_tsquery('portuguese', search_term)) as relevance
  FROM courses c
  WHERE to_tsvector('portuguese', c.title || ' ' || c.description) @@ plainto_tsquery('portuguese', search_term)
  AND c.is_published = true
  
  UNION ALL
  
  SELECT 
    'video'::TEXT as type,
    v.id,
    v.title,
    v.description,
    ts_rank(to_tsvector('portuguese', v.title || ' ' || COALESCE(v.description, '')), plainto_tsquery('portuguese', search_term)) as relevance
  FROM videos v
  JOIN courses c ON v.course_id = c.id
  WHERE to_tsvector('portuguese', v.title || ' ' || COALESCE(v.description, '')) @@ plainto_tsquery('portuguese', search_term)
  AND c.is_published = true
  
  ORDER BY relevance DESC;
END;
$$ LANGUAGE plpgsql;
```

## 📈 Métricas Avançadas

### 1. Tempo de Engajamento
```sql
-- Tabela para tracking de tempo
CREATE TABLE video_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  video_id UUID REFERENCES videos(id),
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  time_watched INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- View para métricas de engajamento
CREATE VIEW engagement_metrics AS
SELECT 
  v.id as video_id,
  v.title,
  COUNT(DISTINCT vs.user_id) as unique_viewers,
  AVG(vs.time_watched) as avg_watch_time,
  SUM(vs.time_watched) as total_watch_time,
  v.duration,
  CASE 
    WHEN v.duration > 0 THEN (AVG(vs.time_watched) / v.duration) * 100
    ELSE 0 
  END as completion_rate
FROM videos v
LEFT JOIN video_sessions vs ON v.id = vs.video_id
GROUP BY v.id, v.title, v.duration;
```

### 2. Análise de Abandono
```sql
-- View para análise de abandono
CREATE VIEW dropout_analysis AS
SELECT 
  c.id as course_id,
  c.title,
  COUNT(DISTINCT up.user_id) as students_started,
  COUNT(DISTINCT CASE WHEN up.completed = true THEN up.user_id END) as students_completed,
  ROUND(
    (COUNT(DISTINCT CASE WHEN up.completed = true THEN up.user_id END)::FLOAT / 
     NULLIF(COUNT(DISTINCT up.user_id), 0)) * 100, 2
  ) as completion_rate,
  AVG(up.progress_percentage) as avg_progress
FROM courses c
LEFT JOIN user_progress up ON c.id = up.course_id
WHERE c.is_published = true
GROUP BY c.id, c.title
ORDER BY completion_rate DESC;
```

## 🎯 Recomendações Personalizadas

### 1. Sistema de Recomendação
```sql
-- Função para recomendar cursos
CREATE OR REPLACE FUNCTION recommend_courses(p_user_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  course_id UUID,
  title TEXT,
  description TEXT,
  level TEXT,
  category TEXT,
  score REAL
) AS $$
BEGIN
  RETURN QUERY
  WITH user_profile AS (
    SELECT department, 
           array_agg(DISTINCT c.category) as completed_categories,
           array_agg(DISTINCT c.level) as completed_levels
    FROM profiles p
    LEFT JOIN user_progress up ON p.id = up.user_id AND up.completed = true
    LEFT JOIN courses c ON up.course_id = c.id
    WHERE p.id = p_user_id
    GROUP BY department
  ),
  course_scores AS (
    SELECT 
      c.id,
      c.title,
      c.description,
      c.level,
      c.category,
      (
        -- Pontuação baseada no departamento
        CASE WHEN c.category = ANY(up.completed_categories) THEN 0.3 ELSE 0 END +
        -- Pontuação baseada no nível
        CASE 
          WHEN c.level = 'beginner' AND 'beginner' = ANY(up.completed_levels) THEN 0.2
          WHEN c.level = 'intermediate' AND 'beginner' = ANY(up.completed_levels) THEN 0.4
          WHEN c.level = 'advanced' AND 'intermediate' = ANY(up.completed_levels) THEN 0.4
          ELSE 0.1
        END +
        -- Pontuação baseada na popularidade
        (SELECT COUNT(*) FROM user_progress WHERE course_id = c.id AND completed = true) * 0.01
      ) as score
    FROM courses c
    CROSS JOIN user_profile up
    WHERE c.is_published = true
    AND c.id NOT IN (
      SELECT course_id FROM user_progress 
      WHERE user_id = p_user_id AND completed = true
    )
  )
  SELECT cs.id, cs.title, cs.description, cs.level, cs.category, cs.score
  FROM course_scores cs
  ORDER BY cs.score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

## 📋 Avaliações e Feedback

### 1. Sistema de Avaliações
```sql
-- Tabela de avaliações
CREATE TABLE course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  course_id UUID REFERENCES courses(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- View para estatísticas de avaliação
CREATE VIEW course_ratings AS
SELECT 
  c.id as course_id,
  c.title,
  COUNT(cr.rating) as total_reviews,
  AVG(cr.rating) as avg_rating,
  COUNT(CASE WHEN cr.rating = 5 THEN 1 END) as five_star,
  COUNT(CASE WHEN cr.rating = 4 THEN 1 END) as four_star,
  COUNT(CASE WHEN cr.rating = 3 THEN 1 END) as three_star,
  COUNT(CASE WHEN cr.rating = 2 THEN 1 END) as two_star,
  COUNT(CASE WHEN cr.rating = 1 THEN 1 END) as one_star
FROM courses c
LEFT JOIN course_reviews cr ON c.id = cr.course_id
GROUP BY c.id, c.title;
```

### 2. Feedback de Vídeos
```sql
-- Tabela de feedback de vídeos
CREATE TABLE video_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  video_id UUID REFERENCES videos(id),
  helpful BOOLEAN,
  feedback_text TEXT,
  timestamp_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔐 Funcionalidades de Segurança

### 1. Log de Atividades
```sql
-- Tabela de logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para log de atividades
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
  VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_details)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;
```

### 2. Controle de Acesso por Tempo
```sql
-- Tabela de sessões ativas
CREATE TABLE active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  session_token TEXT UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para limpar sessões expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM active_sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

## 📊 Integração com Ferramentas Externas

### 1. Webhook para Slack
```sql
-- Tabela de webhooks
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para disparar webhook
CREATE OR REPLACE FUNCTION trigger_webhook(
  p_event TEXT,
  p_data JSONB
)
RETURNS VOID AS $$
DECLARE
  webhook_record RECORD;
BEGIN
  FOR webhook_record IN 
    SELECT * FROM webhooks 
    WHERE active = true AND p_event = ANY(events)
  LOOP
    -- Aqui você implementaria a lógica para enviar HTTP request
    -- Por exemplo, usando pg_net ou uma função externa
    RAISE NOTICE 'Webhook triggered: % for event: %', webhook_record.name, p_event;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### 2. Exportação de Dados
```sql
-- Função para exportar dados de usuário
CREATE OR REPLACE FUNCTION export_user_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'profile', (
      SELECT row_to_json(p.*) FROM profiles p WHERE p.id = p_user_id
    ),
    'progress', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'course', c.title,
          'completed', up.completed,
          'progress', up.progress_percentage,
          'last_watched', up.last_watched_at
        )
      )
      FROM user_progress up
      JOIN courses c ON up.course_id = c.id
      WHERE up.user_id = p_user_id
    ),
    'certificates', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'course', c.title,
          'issued_at', cert.issued_at,
          'certificate_url', cert.certificate_url
        )
      )
      FROM certificates cert
      JOIN courses c ON cert.course_id = c.id
      WHERE cert.user_id = p_user_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

## 🎨 Personalização Visual

### 1. Temas Personalizados
```sql
-- Tabela de temas
CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  colors JSONB NOT NULL,
  fonts JSONB,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir tema padrão
INSERT INTO themes (name, colors, fonts) VALUES (
  'Tema Corporativo',
  '{"primary": "#3B82F6", "secondary": "#64748B", "accent": "#10B981", "background": "#F8FAFC"}',
  '{"heading": "Inter", "body": "Inter"}'
);
```

### 2. Configurações da Empresa
```sql
-- Tabela de configurações
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  logo_url TEXT,
  theme_id UUID REFERENCES themes(id),
  welcome_message TEXT,
  support_email TEXT,
  support_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔄 Backup e Recuperação

### 1. Backup Automático
```bash
#!/bin/bash
# Script de backup automático
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="universidade_backup_$DATE.sql"

# Fazer backup do banco
pg_dump $DATABASE_URL > "$BACKUP_DIR/$BACKUP_FILE"

# Comprimir backup
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Remover backups antigos (manter últimos 30 dias)
find $BACKUP_DIR -name "universidade_backup_*.sql.gz" -mtime +30 -delete

echo "Backup concluído: $BACKUP_FILE.gz"
```

### 2. Monitoramento de Saúde
```sql
-- View para monitoramento
CREATE VIEW system_health AS
SELECT 
  'users' as metric,
  COUNT(*) as value,
  'Total de usuários' as description
FROM profiles
UNION ALL
SELECT 
  'active_users_last_7_days' as metric,
  COUNT(DISTINCT user_id) as value,
  'Usuários ativos últimos 7 dias' as description
FROM user_progress 
WHERE last_watched_at > NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
  'courses_published' as metric,
  COUNT(*) as value,
  'Cursos publicados' as description
FROM courses 
WHERE is_published = true
UNION ALL
SELECT 
  'storage_usage_mb' as metric,
  ROUND(SUM(metadata->>'size')::NUMERIC / 1024 / 1024, 2) as value,
  'Uso de storage em MB' as description
FROM storage.objects 
WHERE bucket_id = 'videos';
```

## 🚀 Deploy de Funcionalidades

Para implementar essas funcionalidades:

1. **Escolha as funcionalidades** que mais fazem sentido para sua empresa
2. **Execute os scripts SQL** no Supabase SQL Editor
3. **Atualize o código frontend** para usar as novas funcionalidades
4. **Teste localmente** antes de fazer deploy
5. **Faça deploy gradual** das funcionalidades

## 📝 Próximos Passos

1. **Priorize** as funcionalidades por impacto
2. **Implemente** uma por vez
3. **Colete feedback** dos usuários
4. **Itere** baseado no uso real
5. **Documente** as mudanças

---

*💡 Lembre-se: Comece simples e vá adicionando funcionalidades conforme a necessidade da sua empresa!*