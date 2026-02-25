# Plataforma Académica — Plan de Producción

## Estado General
- **Framework:** Laravel 12 + Breeze + Inertia.js + React + TypeScript + Tailwind
- **Auth:** Spatie Laravel Permission (4 roles: admin, profesor, estudiante, padre)
- **DB:** SQLite
- **Usuarios seed:** admin@colegio.com, profesor@colegio.com, estudiante@colegio.com, padre@colegio.com (pass: password)

---

## FASE 1 — Núcleo (Modelos base) ✅ COMPLETADO

| # | Modelo | Migración | Modelo | Seeder | Relaciones |
|---|--------|-----------|--------|--------|------------|
| 1 | `periodos` | ✅ | ✅ | ✅ | hasMany notas, boletines |
| 2 | `cursos` | ✅ | ✅ | ✅ | belongsToMany materias, hasMany matriculas |
| 3 | `materias` | ✅ | ✅ | ✅ | belongsToMany cursos |
| 4 | `curso_materia` (pivot) | ✅ | ✅ | ✅ | profesor asignado |
| 5 | `matriculas` | ✅ | ✅ | ✅ | estudiante↔curso↔periodo |
| 6 | `padre_estudiante` (pivot) | ✅ | ✅ | ✅ | padre↔estudiante |

---

## FASE 2 — Académico ✅ COMPLETADO

| # | Modelo | Migración | Modelo | Seeder | Controller |
|---|--------|-----------|--------|--------|------------|
| 7 | `notas` | ✅ | ✅ | ✅ | ✅ |
| 8 | `observaciones` | ✅ | ✅ | ✅ | ✅ |
| 9 | `actividades` | ✅ | ✅ | ✅ | ✅ |
| 10 | `entrega_actividades` | ✅ | ✅ | ✅ | ✅ |

---

## FASE 3 — Operativo ✅ COMPLETADO

| # | Modelo | Migración | Modelo | Seeder | Controller |
|---|--------|-----------|--------|--------|------------|
| 11 | `horario_bloques` | ✅ | ✅ | ✅ | ✅ |
| 12 | `mensajes` | ✅ | ✅ | ✅ | ✅ |
| 13 | `notificaciones` | ✅ | ✅ | ✅ | ✅ |

---

## FASE 4 — Financiero ✅ COMPLETADO

| # | Modelo | Migración | Modelo | Seeder | Controller |
|---|--------|-----------|--------|--------|------------|
| 14 | `concepto_pagos` | ✅ | ✅ | ✅ | ✅ |
| 15 | `pagos` | ✅ | ✅ | ✅ | ✅ |
| 16 | `comprobantes` | ✅ | ✅ | ✅ | ✅ |

---

## FASE 5 — Documentos ✅ COMPLETADO

| # | Modelo | Migración | Modelo | Seeder | Controller |
|---|--------|-----------|--------|--------|------------|
| 17 | `boletines` | ✅ | ✅ | ✅ | ✅ |
| 18 | `certificados` | ✅ | ✅ | ✅ | ✅ |

---

## PÁGINAS — Conexión Backend ↔ Frontend

### Panel Admin (11 páginas) ✅ COMPLETADO
| Página | Ruta | Controller | Props reales | CRUD | Estado |
|--------|------|------------|-------------|------|--------|
| Dashboard | /admin/dashboard | DashboardController | ✅ | N/A | 🟢 |
| Usuarios | /admin/usuarios | UsuarioController | ✅ | ✅ CRUD completo | 🟢 |
| Estudiantes | /admin/estudiantes | EstudianteController | ✅ | Solo lectura | 🟢 |
| Cursos | /admin/cursos | CursoController | ✅ | ✅ CRUD | 🟢 |
| Periodos | /admin/periodos | PeriodoController | ✅ | ✅ CRUD | 🟢 |
| Horarios | /admin/horarios | HorarioController | ✅ | ✅ CRUD | 🟢 |
| Boletines | /admin/boletines | BoletinController | ✅ | ✅ generar | 🟢 |
| Pagos | /admin/pagos | PagoController | ✅ | ✅ CRUD | 🟢 |
| Contabilidad | /admin/contabilidad | ContabilidadController | ✅ | Solo lectura | 🟢 |
| Reportes | /admin/reportes | ReporteController | ✅ | Solo lectura | 🟢 |
| Certificados | /admin/certificados | CertificadoController | ✅ | ✅ CRUD | 🟢 |

### Panel Profesor (6 páginas) ✅ COMPLETADO
| Página | Ruta | Controller | Props reales | CRUD | Estado |
|--------|------|------------|-------------|------|--------|
| Dashboard | /profesor/dashboard | DashboardController | ✅ | N/A | 🟢 |
| RegistrarNotas | /profesor/notas | NotaController | ✅ | ✅ upsert masivo | 🟢 |
| Observador | /profesor/observador | ObservadorController | ✅ | ✅ crear | 🟢 |
| Calendario | /profesor/calendario | CalendarioController | ✅ | Solo lectura | 🟢 |
| Actividades | /profesor/actividades | ActividadController | ✅ | ✅ CRUD | 🟢 |
| Mensajes | /profesor/mensajes | MensajeController | ✅ | ✅ enviar | 🟢 |

### Panel Estudiante (8 páginas) — PENDIENTE
| Página | Ruta | Controller | Props reales | CRUD | Estado |
|--------|------|------------|-------------|------|--------|
| Dashboard | /estudiante/dashboard | EstudianteDashboardController | ❌ mock | N/A | 🔴 |
| Materias | /estudiante/materias | ❌ closure | ❌ hardcoded | ❌ | 🔴 |
| Actividades | /estudiante/actividades | ❌ closure | ❌ hardcoded | ❌ | 🔴 |
| Notas | /estudiante/notas | ❌ closure | ❌ hardcoded | ❌ | 🔴 |
| Horario | /estudiante/horario | ❌ closure | ❌ hardcoded | ❌ | 🔴 |
| Mensajes | /estudiante/mensajes | ❌ closure | ❌ hardcoded | ❌ | 🔴 |
| Observador | /estudiante/observador | ❌ closure | ❌ hardcoded | ❌ | 🔴 |
| Boletines | /estudiante/boletines | ❌ closure | ❌ hardcoded | ❌ | 🔴 |

### Panel Padre (8 páginas) — PENDIENTE
| Página | Ruta | Controller | Props reales | CRUD | Estado |
|--------|------|------------|-------------|------|--------|
| Dashboard | /padre/dashboard | ❌ closure | ❌ hardcoded | N/A | 🔴 |
| Boletin | /padre/boletin | ❌ closure | ❌ hardcoded | ❌ | 🔴 |
| Calendario | /padre/calendario | ❌ closure | ❌ hardcoded | ❌ | 🔴 |
| Seguimiento | /padre/seguimiento | ❌ closure | ❌ hardcoded | ❌ | 🔴 |
| Notificaciones | /padre/notificaciones | ❌ closure | ❌ hardcoded | ❌ | 🔴 |
| Pagos | /padre/pagos | ❌ closure | ❌ hardcoded | ❌ | 🔴 |
| Comprobantes | /padre/comprobantes | ❌ closure | ❌ hardcoded | ❌ | 🔴 |
| Mensajes | /padre/mensajes | ❌ closure | ❌ hardcoded | ❌ | 🔴 |

---

## Leyenda
- 🔴 No implementado (frontend mock)
- 🔶 Parcialmente implementado
- 🟢 Completamente funcional

## Notas
- 16 migraciones ejecutadas, 17 modelos, seeder completo (DatosColegioSeeder)
- 32 rutas admin verificadas con `php artisan route:list`
- 14 rutas profesor verificadas con `php artisan route:list`
- TypeScript compila sin errores (tsc --noEmit EXIT 0)
- Siguiente: Panel Estudiante (controllers + rutas + frontend)
