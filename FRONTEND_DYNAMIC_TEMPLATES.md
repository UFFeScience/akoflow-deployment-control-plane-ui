# Frontend - Dynamic Template Configuration

## Overview

O frontend foi incrementado com suporte completo para carregar e renderizar formulários dinâmicos baseados em definições de templates Terraform.

## Fluxo de Criação de Experimento

O novo fluxo divide a criação de experimento em 4 steps:

### 1. **Basics** (Básico)
- Nome do experimento
- Descrição
- Modo de execução (manual/auto)

### 2. **Template** (Selecionar Template)
- Seleção de template opcional
- Opção "No template" para configuração manual

### 3. **Configuration** (Configuração do Template) ⭐ NOVO
- Carregamento automático do schema da definição
- Renderização dinâmica de campos baseado em tipos
- Suporte a lifecycle hooks (scripts pré/pós provisioning)
- Validação de tipos customizada para cada campo

### 4. **Deployment & Instances** (Infraestrutura)
- Seleção de provider
- Configuração de região
- Definição de instance groups

## Arquitetura Frontend

### Componentes Principais

#### 1. **FormFieldComponent** (`components/form/form-field.tsx`)
Renderiza um campo de formulário baseado no tipo especificado no schema.

**Tipos Suportados:**
- `string` - Input de texto simples
- `text` - Textarea multiline
- `number` - Input número com validações (min/max)
- `boolean` - Checkbox
- `select` - Dropdown com seleção única
- `multiselect` - Múltiplas seleções com botões
- `script` - Textarea com editor monoespaçado para scripts
- `array` - Editor JSON para arrays
- `object` - Editor JSON para objetos
- `key_value` - Editor de pares chave-valor

```tsx
import { FormFieldComponent } from "@/components/form/form-field"

<FormFieldComponent
  field={fieldDefinition}
  value={fieldValue}
  onChange={handleChange}
  error={errorMessage}
/>
```

#### 2. **DynamicForm** (`components/form/dynamic-form.tsx`)
Renderiza múltiplas seções de campos de formulário baseado no schema completo.

```tsx
import { DynamicForm } from "@/components/form/dynamic-form"

<DynamicForm
  definition={templateDefinition}
  values={terraformVariables}
  onChange={setTerraformVariables}
  errors={validationErrors}
/>
```

#### 3. **LifecycleHooksForm** (`components/form/lifecycle-hooks-form.tsx`)
Renderiza formulário específico para lifecycle hooks (scripts pré/pós provisioning).

```tsx
import { LifecycleHooksForm } from "@/components/form/lifecycle-hooks-form"

<LifecycleHooksForm
  definition={templateDefinition}
  values={lifecycleHooks}
  onChange={setLifecycleHooks}
/>
```

### Hooks Customizados

#### **useTemplateDefinition** (`hooks/use-template-definition.ts`)
Carrega a definição de um template (schema com seções e campos).

```tsx
import { useTemplateDefinition } from "@/hooks/use-template-definition"

const { definition, isLoading, error } = useTemplateDefinition(templateId)
```

**Comportamento:**
- Retorna `null` se templateId for "none" ou null
- Carrega automaticamente quando templateId muda
- Trata erros graciosamente
- Suporta callback `onError`

### API

#### Tipos Atualizados

```typescript
// lib/api/types.ts

interface TemplateDefinition {
  deployment_defaults?: Record<string, unknown>
  ui?: {
    allow_multiple_instance_groups?: boolean
  }
  sections?: FormSection[]        // Seções de configuração
  lifecycle_hooks?: LifecycleHook[] // Scripts pré/pós
}

interface FormSection {
  name: string
  label: string
  description?: string
  fields: FormField[]
}

interface FormField {
  name: string
  label: string
  type: FieldType
  description?: string
  required?: boolean
  default?: unknown
  nullable?: boolean
  min?: number              // Number fields
  max?: number
  step?: number
  maxLength?: number        // String/text/script fields
  maxItems?: number         // Array fields
  minItems?: number
  options?: { label: string; value: string }[] // Select/multiselect
}

interface LifecycleHook {
  name: string
  label: string
  type: "script"
  required?: boolean
  maxLength?: number
}
```

#### Endpoints de API

```typescript
// lib/api/templates.ts

templatesApi.getActiveVersion(templateId)
// GET /api/experiment-templates/{id}/versions/active
// Retorna: TemplateVersion com definition_json

templatesApi.getDefinition(templateId)
// GET /api/experiment-templates/{id}/versions/active
// Retorna: Apenas a TemplateDefinition
```

#### Criação de Experimento

```typescript
// lib/api/experiments.ts

experimentsApi.create(projectId, {
  name: string
  description?: string
  template_id?: string
  terraform_variables?: Record<string, unknown>
  lifecycle_hooks?: Record<string, string>
  provider_id?: string
  instance_groups?: Array<{
    instance_type_id: string
    role?: string
    quantity: number
    metadata?: Record<string, unknown>
  }>
})
```

## Exemplo de Uso

### Simulação de Usando com Template K8s

```tsx
// User seleciona template K8s
const templateId = "abc123"

// Hook carrega a definição
const { definition } = useTemplateDefinition(templateId)

// definition contém:
{
  deployment_defaults: { provider: "aws", region: "us-east-1" },
  sections: [
    {
      name: "infrastructure",
      label: "Infrastructure",
      fields: [
        {
          name: "vpc_cidr",
          label: "VPC CIDR",
          type: "string",
          description: "CIDR block for the VPC",
          required: true,
          default: "10.0.0.0/16"
        },
        {
          name: "instance_count",
          label: "Instance Count",
          type: "number",
          required: true,
          min: 1,
          max: 100
        }
      ]
    }
  ],
  lifecycle_hooks: [
    {
      name: "pre_provision",
      label: "Pre-Provision Script",
      type: "script",
      description: "Script to run before provisioning"
    }
  ]
}

// Frontend renderiza formulário dinâmico com:
// - Campo string: vpc_cidr
// - Campo number: instance_count
// - Campo script: pre_provision

// User preenche:
terraformVariables = {
  vpc_cidr: "10.0.0.0/16",
  instance_count: 5
}

lifecycleHooks = {
  pre_provision: "#!/bin/bash\necho 'Starting...'"
}

// Ao criar o experimento, envia:
experimentsApi.create(projectId, {
  name: "My K8s Deployment",
  template_id: "abc123",
  terraform_variables: terraformVariables,
  lifecycle_hooks: lifecycleHooks,
  provider_id: "aws-1",
  instance_groups: [...]
})
```

## Validação

### Frontend (Validação de UI)
- Campos obrigatórios marcados com `*`
- Mensagens de erro inline
- Validação de tipo em tempo real

### Backend (Validação Robusta)
O backend valida:
- Existência de template
- Tipagem correta de valores
- Constraints (min/max, maxLength)
- Whitelisting de opções (select/multiselect)
- Sanitization de scripts (remove PHP tags)

## Tratamento de Erros

```tsx
const { definition, isLoading, error } = useTemplateDefinition(templateId, {
  onError: (error) => {
    toast.error(`Failed to load template: ${error.message}`)
  }
})

if (error) {
  // Renderer fallback UI
}
```

## Sem Duplicação de Código

A arquitetura foi desenhada para:
1. **Reutilizar componentes** - FormFieldComponent é usado em DynamicForm e LifecycleHooksForm
2. **Tipos compartilhados** - Definição única em types.ts, usada em todos os componentes
3. **Lógica centralizada** - Validação no backend, renderização genérica no frontend
4. **Extensibilidade** - Novos tipos de campos podem ser adicionados apenas ao FormFieldComponent

## Próximos Passos (Opcional)

1. Adicionar validação frontend mais robusta (regex patterns, custom validators)
2. Adicionar preview/help para campos
3. Suportar condicionais (campo X aparece se campo Y = Z)
4. Adicionar upload de arquivos em campos
5. Suporte a nested objects em array fields
