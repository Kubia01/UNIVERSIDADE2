#!/usr/bin/env node

/**
 * Script para criar a tabela course_assignments no Supabase
 * Execute: node setup-course-assignments.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
  console.error('Verifique se o arquivo .env.local está configurado corretamente')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const createCourseAssignmentsTable = async () => {
  try {
    console.log('🚀 Iniciando criação da tabela course_assignments...')

    // SQL para criar a tabela e configurações
    const sql = `
      -- Criar tabela de atribuições de cursos
      CREATE TABLE IF NOT EXISTS course_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Evitar duplicatas
        UNIQUE(user_id, course_id)
      );

      -- Criar índices para performance
      CREATE INDEX IF NOT EXISTS idx_course_assignments_user_id ON course_assignments(user_id);
      CREATE INDEX IF NOT EXISTS idx_course_assignments_course_id ON course_assignments(course_id);
      CREATE INDEX IF NOT EXISTS idx_course_assignments_assigned_by ON course_assignments(assigned_by);

      -- Habilitar Row Level Security
      ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;

      -- Remover políticas existentes se houver
      DROP POLICY IF EXISTS "Users can view their own course assignments" ON course_assignments;
      DROP POLICY IF EXISTS "Admins can manage all course assignments" ON course_assignments;

      -- Política para usuários visualizarem suas próprias atribuições
      CREATE POLICY "Users can view their own course assignments" ON course_assignments
        FOR SELECT USING (auth.uid() = user_id);

      -- Política para admins gerenciarem todas as atribuições
      CREATE POLICY "Admins can manage all course assignments" ON course_assignments
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
          )
        );

      -- Função para atualizar updated_at automaticamente
      CREATE OR REPLACE FUNCTION update_course_assignments_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Trigger para atualizar updated_at
      DROP TRIGGER IF EXISTS trigger_update_course_assignments_updated_at ON course_assignments;
      CREATE TRIGGER trigger_update_course_assignments_updated_at
        BEFORE UPDATE ON course_assignments
        FOR EACH ROW
        EXECUTE FUNCTION update_course_assignments_updated_at();
    `

    // Executar o SQL usando uma consulta RPC personalizada
    const { data, error } = await supabase.rpc('exec', { sql })

    if (error) {
      // Se RPC não funcionar, tentar método alternativo
      console.log('⚠️ Método RPC não disponível, tentando método alternativo...')
      
      // Tentar criar usando queries individuais
      const queries = [
        `CREATE TABLE IF NOT EXISTS course_assignments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          course_id UUID NOT NULL,
          assigned_by UUID,
          assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, course_id)
        )`,
        `ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY`
      ]

      for (const query of queries) {
        try {
          await supabase.from('_').select().limit(0) // Dummy query para testar conexão
        } catch (e) {
          console.log('Query:', query)
        }
      }
      
      console.log('❌ Não foi possível criar a tabela automaticamente.')
      console.log('📋 Execute o SQL abaixo manualmente no Supabase Dashboard:')
      console.log('=' .repeat(80))
      console.log(sql)
      console.log('=' .repeat(80))
      console.log('\n🔗 Acesse: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/sql')
      return
    }

    console.log('✅ Tabela course_assignments criada com sucesso!')
    console.log('✅ Políticas de segurança configuradas!')
    console.log('✅ Índices criados para performance!')
    console.log('✅ Triggers configurados!')
    
    // Verificar se a tabela foi criada
    const { data: testData, error: testError } = await supabase
      .from('course_assignments')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.log('⚠️ Tabela criada mas pode haver problemas de permissão:', testError.message)
    } else {
      console.log('✅ Verificação concluída - tabela funcionando corretamente!')
    }

  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error.message)
    console.log('\n📋 Execute o SQL abaixo manualmente no Supabase Dashboard:')
    console.log('=' .repeat(80))
    console.log(`
      CREATE TABLE IF NOT EXISTS course_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, course_id)
      );

      ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;

      CREATE POLICY "Users can view their own course assignments" ON course_assignments
        FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY "Admins can manage all course assignments" ON course_assignments
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
          )
        );
    `)
    console.log('=' .repeat(80))
  }
}

// Executar o script
createCourseAssignmentsTable()
  .then(() => {
    console.log('\n🎉 Setup concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })