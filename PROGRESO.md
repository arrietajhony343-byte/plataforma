# Plataforma Académica — Estado del Proyecto

## Stack
- **Framework:** Laravel 12 + Breeze + Inertia.js + React + TypeScript + Tailwind CSS
- **Auth:** Spatie Laravel Permission — roles: admin, coordinador, profesor, estudiante, padre
- **DB:** SQLite
- **PDF:** jsPDF + jspdf-autotable (generación browser-side)

## Credenciales de prueba
| Email | Password | Rol |
|-------|----------|-----|
| admin@colegio.com | password | admin |
| yuchy26@hotmail.com | — | coordinador |

---

## Paneles implementados

### Panel Admin / Coordinador ✅ COMPLETO
| Página | Ruta | Estado |
|--------|------|--------|
| Dashboard | /admin/dashboard | 🟢 |
| Usuarios | /admin/usuarios | 🟢 CRUD completo |
| Estudiantes | /admin/estudiantes | 🟢 Lectura + export |
| Cursos + Materias | /admin/cursos | 🟢 CRUD |
| Periodos | /admin/periodos | 🟢 CRUD + ventanas + excepciones |
| Horarios | /admin/horarios | 🟢 CRUD |
| Boletines | /admin/boletines | 🟢 Generar PDF + notificar |
| Pagos | /admin/pagos | 🟢 CRUD + confirmar/anular |
| Contabilidad | /admin/contabilidad | 🟢 Solo lectura |
| Reportes | /admin/reportes | 🟢 Rendimiento + asistencia + export |
| Certificados | /admin/certificados | 🟢 CRUD + PDF + pago + notificar |
| Cafetería | /admin/cafeteria | 🟢 Productos + ventas + compras |
| Sedes | /admin/sedes | 🟢 CRUD (solo admin) |
| Mensajes | /admin/mensajes | 🟢 Chat en tiempo real |

### Panel Profesor ✅ COMPLETO
| Página | Ruta | Estado |
|--------|------|--------|
| Dashboard | /profesor/dashboard | 🟢 |
| Registrar Notas | /profesor/notas | 🟢 Upsert masivo + conceptos |
| Observador | /profesor/observador | 🟢 Crear + director reporte |
| Horario | /profesor/horario | 🟢 |
| Calendario | /profesor/calendario | 🟢 Eventos personales |
| Actividades | /profesor/actividades | 🟢 CRUD + calificar + entregas |
| Asistencias | /profesor/asistencias | 🟢 Registro masivo + resumen |
| Mensajes | /profesor/mensajes | 🟢 |

### Panel Estudiante ✅ COMPLETO
| Página | Ruta | Estado |
|--------|------|--------|
| Dashboard | /estudiante/dashboard | 🟢 |
| Materias + Actividades | /estudiante/materias | 🟢 |
| Actividad detalle | /estudiante/actividades/{id} | 🟢 Entregar + quiz |
| Notas | /estudiante/notas | 🟢 |
| Horario | /estudiante/horario | 🟢 |
| Observador | /estudiante/observador | 🟢 |
| Boletines | /estudiante/boletines | 🟢 |
| Mensajes | /estudiante/mensajes | 🟢 |

### Panel Padre ✅ COMPLETO
| Página | Ruta | Estado |
|--------|------|--------|
| Dashboard | /padre/dashboard | 🟢 |
| Boletín | /padre/boletin | 🟢 Ver + descargar PDF |
| Calendario | /padre/calendario | 🟢 |
| Horario | /padre/horario | 🟢 |
| Seguimiento | /padre/seguimiento | 🟢 |
| Observador | /padre/observador | 🟢 |
| Notificaciones | /padre/notificaciones | 🟢 |
| Certificados | /padre/certificados | 🟢 Solicitar + descargar |
| Pagos | /padre/pagos | 🟢 Ver + pagar |
| Comprobantes | /padre/comprobantes | 🟢 |
| Mensajes | /padre/mensajes | 🟢 |

---

## Generación de PDFs
- **Boletines:** `Admin/Boletines.tsx` — genera por estudiante o masivo (todos los de un curso/período)
- **Certificados:** `Admin/Certificados.tsx` — genera y sube al servidor; padre descarga desde su portal
- **Shared utils:** `resources/js/utils/pdfUtils.ts` — logo loading, escala valorativa, constantes institución
- **Logo:** `/public/logo-certificados.png` ✅ existe
- **Escala:** SUPERIOR ≥ 4.5 · ALTO ≥ 4.0 · BÁSICO ≥ 3.0 · BAJO < 3.0

## Correcciones aplicadas (2026-05-30)
- N+1 fix: `CertificadoController` — `padres` eager-loaded
- N+1 fix: `BoletinController` — `todosPeriodos` pre-cacheado por año
- Umbral SUPERIOR: corregido 4.6 → 4.5 en CertificadoController y Certificados.tsx
- `nivelesConfig` completado con `transicion`/`preescolar`/`secundaria`/`media` en ambos TSX
- Código duplicado extraído a `pdfUtils.ts` (logo loading, candidatos, constantes institución)
- Firma hardcoded `INDIRA CANO ROMAN` → `PDF_INSTITUCION.firmaNombre` (un solo lugar de edición)
- Sidebar: badge de mensajes no-leídos + polling automático 60s (notificaciones + mensajes)
