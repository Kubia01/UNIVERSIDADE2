# Correção Crítica - Erro "column courses.image_url does not exist"

## Data: Janeiro 2025

### Problema Identificado:
```
❌ Erro na query: column courses.image_url does not exist
```

**Causa**: Na correção anterior das thumbnails, adicionei o campo `image_url` nas queries pensando que existia na tabela, mas este campo não existe no banco de dados Supabase.

### Erro nos Logs:
```
sfifbgzceuercnqaaqgt.supabase.co/rest/v1/courses?select=id%2Ctitle%2Cdescription%2Ctype%2Cduration%2Cinstructor%2Cdepartment%2Cis_published%2Cis_mandatory%2Cthumbnail%2Cimage_url%2Ccreated_at%2Cupdated_at&order=created_at.desc&limit=100:1  Failed to load resource: the server responded with a status of 400 ()
```

**Resultado**: Sistema não conseguia carregar nenhum curso, mostrando erro de conectividade.

---

## Correções Aplicadas:

### 1. **lib/supabase-emergency.ts**
#### ANTES (Problemático):
```javascript
.select('id, title, description, type, duration, instructor, department, is_published, is_mandatory, thumbnail, image_url, created_at, updated_at')
```

#### DEPOIS (Corrigido):
```javascript
.select('id, title, description, type, duration, instructor, department, is_published, is_mandatory, thumbnail, created_at, updated_at')
```

### 2. **components/admin/CourseManagement.tsx**
#### ANTES (Problemático):
```javascript
.select('id, title, description, type, duration, instructor, department, is_published, is_mandatory, thumbnail, image_url, created_at, updated_at')
```

#### DEPOIS (Corrigido):
```javascript
.select('id, title, description, type, duration, instructor, department, is_published, is_mandatory, thumbnail, created_at, updated_at')
```

### 3. **lib/supabase.ts**
#### ANTES (Problemático):
```typescript
export interface Course {
  thumbnail?: string
  image_url?: string // Compatibilidade com nome alternativo para imagem
}
```

#### DEPOIS (Corrigido):
```typescript
export interface Course {
  thumbnail?: string
}
```

### 4. **app/page.tsx**
#### ANTES (Problemático):
```javascript
{course.image_url && (
  <img src={course.image_url} alt={course.title} />
)}
```

#### DEPOIS (Corrigido):
```javascript
{course.thumbnail && (
  <img src={course.thumbnail} alt={course.title} />
)}
```

### 5. **Logs de Debug**
#### ANTES (Problemático):
```javascript
console.log('💾 [CourseManagement] Dados a serem enviados:', {
  thumbnail: courseToSave.thumbnail ? 'SIM' : 'NÃO',
  image_url: courseToSave.image_url ? 'SIM' : 'NÃO'
})
```

#### DEPOIS (Corrigido):
```javascript
console.log('💾 [CourseManagement] Dados a serem enviados:', {
  thumbnail: courseToSave.thumbnail ? 'SIM' : 'NÃO'
})
```

---

## Resultado:
✅ **Erro 400 resolvido**
✅ **Cursos carregando normalmente**
✅ **Queries funcionando corretamente**
✅ **Sistema totalmente funcional**

---

## Lição Aprendida:
- Sempre verificar se os campos existem na estrutura real da tabela antes de adicioná-los nas queries
- O campo `image_url` não existe na tabela `courses` - apenas `thumbnail` está disponível
- Usar apenas `thumbnail` para armazenar e exibir imagens dos cursos

---

**Status: ✅ ERRO CRÍTICO RESOLVIDO**

*Sistema voltou ao funcionamento normal*
*Thumbnails funcionam corretamente apenas com campo `thumbnail`*