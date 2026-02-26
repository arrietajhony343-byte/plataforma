CREATE TABLE IF NOT EXISTS "migrations"(
  "id" integer primary key autoincrement not null,
  "migration" varchar not null,
  "batch" integer not null
);
CREATE TABLE IF NOT EXISTS "users"(
  "id" integer primary key autoincrement not null,
  "name" varchar not null,
  "email" varchar not null,
  "email_verified_at" datetime,
  "password" varchar not null,
  "remember_token" varchar,
  "created_at" datetime,
  "updated_at" datetime,
  "documento" varchar,
  "tipo_documento" varchar not null default 'CC',
  "telefono" varchar,
  "direccion" varchar,
  "fecha_nacimiento" date,
  "genero" varchar check("genero" in('M', 'F', 'otro')),
  "foto" varchar,
  "activo" tinyint(1) not null default '1',
  "login_attempts" integer not null default '0',
  "last_login_at" datetime,
  "must_change_password" tinyint(1) not null default '0'
);
CREATE UNIQUE INDEX "users_email_unique" on "users"("email");
CREATE TABLE IF NOT EXISTS "password_reset_tokens"(
  "email" varchar not null,
  "token" varchar not null,
  "created_at" datetime,
  primary key("email")
);
CREATE TABLE IF NOT EXISTS "sessions"(
  "id" varchar not null,
  "user_id" integer,
  "ip_address" varchar,
  "user_agent" text,
  "payload" text not null,
  "last_activity" integer not null,
  primary key("id")
);
CREATE INDEX "sessions_user_id_index" on "sessions"("user_id");
CREATE INDEX "sessions_last_activity_index" on "sessions"("last_activity");
CREATE TABLE IF NOT EXISTS "cache"(
  "key" varchar not null,
  "value" text not null,
  "expiration" integer not null,
  primary key("key")
);
CREATE INDEX "cache_expiration_index" on "cache"("expiration");
CREATE TABLE IF NOT EXISTS "cache_locks"(
  "key" varchar not null,
  "owner" varchar not null,
  "expiration" integer not null,
  primary key("key")
);
CREATE INDEX "cache_locks_expiration_index" on "cache_locks"("expiration");
CREATE TABLE IF NOT EXISTS "jobs"(
  "id" integer primary key autoincrement not null,
  "queue" varchar not null,
  "payload" text not null,
  "attempts" integer not null,
  "reserved_at" integer,
  "available_at" integer not null,
  "created_at" integer not null
);
CREATE INDEX "jobs_queue_index" on "jobs"("queue");
CREATE TABLE IF NOT EXISTS "job_batches"(
  "id" varchar not null,
  "name" varchar not null,
  "total_jobs" integer not null,
  "pending_jobs" integer not null,
  "failed_jobs" integer not null,
  "failed_job_ids" text not null,
  "options" text,
  "cancelled_at" integer,
  "created_at" integer not null,
  "finished_at" integer,
  primary key("id")
);
CREATE TABLE IF NOT EXISTS "failed_jobs"(
  "id" integer primary key autoincrement not null,
  "uuid" varchar not null,
  "connection" text not null,
  "queue" text not null,
  "payload" text not null,
  "exception" text not null,
  "failed_at" datetime not null default CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "failed_jobs_uuid_unique" on "failed_jobs"("uuid");
CREATE TABLE IF NOT EXISTS "permissions"(
  "id" integer primary key autoincrement not null,
  "name" varchar not null,
  "guard_name" varchar not null,
  "created_at" datetime,
  "updated_at" datetime
);
CREATE UNIQUE INDEX "permissions_name_guard_name_unique" on "permissions"(
  "name",
  "guard_name"
);
CREATE TABLE IF NOT EXISTS "roles"(
  "id" integer primary key autoincrement not null,
  "name" varchar not null,
  "guard_name" varchar not null,
  "created_at" datetime,
  "updated_at" datetime
);
CREATE UNIQUE INDEX "roles_name_guard_name_unique" on "roles"(
  "name",
  "guard_name"
);
CREATE TABLE IF NOT EXISTS "model_has_permissions"(
  "permission_id" integer not null,
  "model_type" varchar not null,
  "model_id" integer not null,
  foreign key("permission_id") references "permissions"("id") on delete cascade,
  primary key("permission_id", "model_id", "model_type")
);
CREATE INDEX "model_has_permissions_model_id_model_type_index" on "model_has_permissions"(
  "model_id",
  "model_type"
);
CREATE TABLE IF NOT EXISTS "model_has_roles"(
  "role_id" integer not null,
  "model_type" varchar not null,
  "model_id" integer not null,
  foreign key("role_id") references "roles"("id") on delete cascade,
  primary key("role_id", "model_id", "model_type")
);
CREATE INDEX "model_has_roles_model_id_model_type_index" on "model_has_roles"(
  "model_id",
  "model_type"
);
CREATE TABLE IF NOT EXISTS "role_has_permissions"(
  "permission_id" integer not null,
  "role_id" integer not null,
  foreign key("permission_id") references "permissions"("id") on delete cascade,
  foreign key("role_id") references "roles"("id") on delete cascade,
  primary key("permission_id", "role_id")
);
CREATE TABLE IF NOT EXISTS "periodos"(
  "id" integer primary key autoincrement not null,
  "anio" integer not null,
  "nombre" varchar not null,
  "numero" integer not null,
  "fecha_inicio" date not null,
  "fecha_fin" date not null,
  "porcentaje" numeric not null default '25',
  "estado" varchar check("estado" in('activo', 'finalizado', 'pendiente')) not null default 'pendiente',
  "created_at" datetime,
  "updated_at" datetime
);
CREATE UNIQUE INDEX "periodos_anio_numero_unique" on "periodos"(
  "anio",
  "numero"
);
CREATE TABLE IF NOT EXISTS "cursos"(
  "id" integer primary key autoincrement not null,
  "nombre" varchar not null,
  "nivel" varchar check("nivel" in('preescolar', 'transicion', 'primaria', 'bachillerato')) not null,
  "grado" varchar not null,
  "grupo" varchar not null default 'A',
  "jornada" varchar not null default 'mañana',
  "anio" integer not null,
  "cupo_maximo" integer not null default '35',
  "director_grupo_id" integer,
  "activo" tinyint(1) not null default '1',
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("director_grupo_id") references "users"("id") on delete set null
);
CREATE UNIQUE INDEX "cursos_grado_grupo_jornada_anio_unique" on "cursos"(
  "grado",
  "grupo",
  "jornada",
  "anio"
);
CREATE TABLE IF NOT EXISTS "materias"(
  "id" integer primary key autoincrement not null,
  "nombre" varchar not null,
  "area" varchar not null,
  "codigo" varchar not null,
  "horas_semanales" integer not null default '4',
  "activa" tinyint(1) not null default '1',
  "created_at" datetime,
  "updated_at" datetime
);
CREATE UNIQUE INDEX "materias_codigo_unique" on "materias"("codigo");
CREATE TABLE IF NOT EXISTS "curso_materia"(
  "id" integer primary key autoincrement not null,
  "curso_id" integer not null,
  "materia_id" integer not null,
  "profesor_id" integer not null,
  "horas_semanales" integer not null default '4',
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("curso_id") references "cursos"("id") on delete cascade,
  foreign key("materia_id") references "materias"("id") on delete cascade,
  foreign key("profesor_id") references "users"("id") on delete cascade
);
CREATE UNIQUE INDEX "curso_materia_curso_id_materia_id_unique" on "curso_materia"(
  "curso_id",
  "materia_id"
);
CREATE TABLE IF NOT EXISTS "matriculas"(
  "id" integer primary key autoincrement not null,
  "estudiante_id" integer not null,
  "curso_id" integer not null,
  "periodo_id" integer not null,
  "estado" varchar check("estado" in('activa', 'retirada', 'graduada')) not null default 'activa',
  "fecha_matricula" date not null,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("estudiante_id") references "users"("id") on delete cascade,
  foreign key("curso_id") references "cursos"("id") on delete cascade,
  foreign key("periodo_id") references "periodos"("id") on delete cascade
);
CREATE UNIQUE INDEX "matriculas_estudiante_id_curso_id_periodo_id_unique" on "matriculas"(
  "estudiante_id",
  "curso_id",
  "periodo_id"
);
CREATE TABLE IF NOT EXISTS "padre_estudiante"(
  "id" integer primary key autoincrement not null,
  "padre_id" integer not null,
  "estudiante_id" integer not null,
  "parentesco" varchar not null default 'padre',
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("padre_id") references "users"("id") on delete cascade,
  foreign key("estudiante_id") references "users"("id") on delete cascade
);
CREATE UNIQUE INDEX "padre_estudiante_padre_id_estudiante_id_unique" on "padre_estudiante"(
  "padre_id",
  "estudiante_id"
);
CREATE TABLE IF NOT EXISTS "notas"(
  "id" integer primary key autoincrement not null,
  "estudiante_id" integer not null,
  "curso_materia_id" integer not null,
  "periodo_id" integer not null,
  "valor" numeric not null,
  "tipo" varchar not null default 'definitiva',
  "descripcion" varchar,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("estudiante_id") references "users"("id") on delete cascade,
  foreign key("curso_materia_id") references "curso_materia"("id") on delete cascade,
  foreign key("periodo_id") references "periodos"("id") on delete cascade
);
CREATE INDEX "notas_estudiante_id_periodo_id_index" on "notas"(
  "estudiante_id",
  "periodo_id"
);
CREATE TABLE IF NOT EXISTS "observaciones"(
  "id" integer primary key autoincrement not null,
  "estudiante_id" integer not null,
  "profesor_id" integer not null,
  "materia_id" integer,
  "tipo" varchar check("tipo" in('positiva', 'negativa')) not null,
  "categoria" varchar not null,
  "descripcion" text not null,
  "fecha" date not null,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("estudiante_id") references "users"("id") on delete cascade,
  foreign key("profesor_id") references "users"("id") on delete cascade,
  foreign key("materia_id") references "materias"("id") on delete set null
);
CREATE INDEX "observaciones_estudiante_id_tipo_index" on "observaciones"(
  "estudiante_id",
  "tipo"
);
CREATE TABLE IF NOT EXISTS "actividades"(
  "id" integer primary key autoincrement not null,
  "curso_materia_id" integer not null,
  "titulo" varchar not null,
  "descripcion" text,
  "tipo" varchar check("tipo" in('tarea', 'quiz', 'examen', 'proyecto', 'taller')) not null,
  "fecha_asignacion" date not null,
  "fecha_entrega" date not null,
  "porcentaje" numeric not null default '0',
  "activa" tinyint(1) not null default '1',
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("curso_materia_id") references "curso_materia"("id") on delete cascade
);
CREATE TABLE IF NOT EXISTS "entregas"(
  "id" integer primary key autoincrement not null,
  "actividad_id" integer not null,
  "estudiante_id" integer not null,
  "contenido" text,
  "archivo" varchar,
  "calificacion" numeric,
  "retroalimentacion" text,
  "estado" varchar check("estado" in('pendiente', 'entregada', 'calificada', 'atrasada')) not null default 'pendiente',
  "fecha_entrega" datetime,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("actividad_id") references "actividades"("id") on delete cascade,
  foreign key("estudiante_id") references "users"("id") on delete cascade
);
CREATE UNIQUE INDEX "entregas_actividad_id_estudiante_id_unique" on "entregas"(
  "actividad_id",
  "estudiante_id"
);
CREATE TABLE IF NOT EXISTS "horario_bloques"(
  "id" integer primary key autoincrement not null,
  "curso_materia_id" integer not null,
  "dia" varchar check("dia" in('lunes', 'martes', 'miercoles', 'jueves', 'viernes')) not null,
  "hora_inicio" time not null,
  "hora_fin" time not null,
  "salon" varchar,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("curso_materia_id") references "curso_materia"("id") on delete cascade
);
CREATE UNIQUE INDEX "horario_bloques_curso_materia_id_dia_hora_inicio_unique" on "horario_bloques"(
  "curso_materia_id",
  "dia",
  "hora_inicio"
);
CREATE TABLE IF NOT EXISTS "mensajes"(
  "id" integer primary key autoincrement not null,
  "remitente_id" integer not null,
  "destinatario_id" integer not null,
  "contenido" text not null,
  "asunto" varchar,
  "leido" tinyint(1) not null default '0',
  "leido_at" datetime,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("remitente_id") references "users"("id") on delete cascade,
  foreign key("destinatario_id") references "users"("id") on delete cascade
);
CREATE INDEX "mensajes_destinatario_id_leido_index" on "mensajes"(
  "destinatario_id",
  "leido"
);
CREATE INDEX "mensajes_remitente_id_destinatario_id_index" on "mensajes"(
  "remitente_id",
  "destinatario_id"
);
CREATE TABLE IF NOT EXISTS "notificaciones"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "tipo" varchar not null,
  "titulo" varchar not null,
  "mensaje" text not null,
  "leida" tinyint(1) not null default '0',
  "leida_at" datetime,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("user_id") references "users"("id") on delete cascade
);
CREATE INDEX "notificaciones_user_id_leida_index" on "notificaciones"(
  "user_id",
  "leida"
);
CREATE TABLE IF NOT EXISTS "concepto_pagos"(
  "id" integer primary key autoincrement not null,
  "nombre" varchar not null,
  "descripcion" text,
  "monto" numeric not null,
  "periodicidad" varchar check("periodicidad" in('unico', 'mensual', 'anual')) not null default 'mensual',
  "activo" tinyint(1) not null default '1',
  "created_at" datetime,
  "updated_at" datetime
);
CREATE TABLE IF NOT EXISTS "pagos"(
  "id" integer primary key autoincrement not null,
  "estudiante_id" integer not null,
  "concepto_pago_id" integer not null,
  "periodo_id" integer,
  "monto" numeric not null,
  "estado" varchar check("estado" in('pendiente', 'pagado', 'vencido', 'anulado')) not null default 'pendiente',
  "metodo_pago" varchar,
  "referencia" varchar,
  "fecha_vencimiento" date not null,
  "fecha_pago" date,
  "notas" text,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("estudiante_id") references "users"("id") on delete cascade,
  foreign key("concepto_pago_id") references "concepto_pagos"("id") on delete cascade,
  foreign key("periodo_id") references "periodos"("id") on delete set null
);
CREATE INDEX "pagos_estudiante_id_estado_index" on "pagos"(
  "estudiante_id",
  "estado"
);
CREATE TABLE IF NOT EXISTS "comprobantes"(
  "id" integer primary key autoincrement not null,
  "pago_id" integer not null,
  "archivo" varchar not null,
  "estado" varchar check("estado" in('pendiente', 'confirmado', 'rechazado')) not null default 'pendiente',
  "nota_admin" text,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("pago_id") references "pagos"("id") on delete cascade
);
CREATE TABLE IF NOT EXISTS "boletines"(
  "id" integer primary key autoincrement not null,
  "estudiante_id" integer not null,
  "periodo_id" integer not null,
  "curso_id" integer not null,
  "promedio" numeric,
  "puesto" integer,
  "observacion_general" text,
  "archivo" varchar,
  "estado" varchar check("estado" in('borrador', 'generado', 'entregado')) not null default 'borrador',
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("estudiante_id") references "users"("id") on delete cascade,
  foreign key("periodo_id") references "periodos"("id") on delete cascade,
  foreign key("curso_id") references "cursos"("id") on delete cascade
);
CREATE UNIQUE INDEX "boletines_estudiante_id_periodo_id_unique" on "boletines"(
  "estudiante_id",
  "periodo_id"
);
CREATE UNIQUE INDEX "users_documento_unique" on "users"("documento");
CREATE TABLE IF NOT EXISTS "user_activity_logs"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "action" varchar not null,
  "performed_by_name" varchar not null,
  "performed_by_id" integer not null,
  "reason" text,
  "details" text,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("user_id") references "users"("id") on delete cascade,
  foreign key("performed_by_id") references "users"("id") on delete cascade
);
CREATE TABLE IF NOT EXISTS "materia_profesor"(
  "id" integer primary key autoincrement not null,
  "materia_id" integer not null,
  "profesor_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("materia_id") references "materias"("id") on delete cascade,
  foreign key("profesor_id") references "users"("id") on delete cascade
);
CREATE UNIQUE INDEX "materia_profesor_materia_id_profesor_id_unique" on "materia_profesor"(
  "materia_id",
  "profesor_id"
);
CREATE TABLE IF NOT EXISTS "tipo_certificados"(
  "id" integer primary key autoincrement not null,
  "nombre" varchar not null,
  "codigo" varchar not null,
  "descripcion" text,
  "precio" integer not null default '0',
  "activo" tinyint(1) not null default '1',
  "created_at" datetime,
  "updated_at" datetime
);
CREATE UNIQUE INDEX "tipo_certificados_codigo_unique" on "tipo_certificados"(
  "codigo"
);
CREATE TABLE IF NOT EXISTS "certificados"(
  "id" integer primary key autoincrement not null,
  "estudiante_id" integer not null,
  "tipo" varchar not null,
  "descripcion" varchar,
  "archivo" varchar,
  "estado" varchar not null default('solicitado'),
  "fecha_solicitud" date not null,
  "fecha_entrega" date,
  "created_at" datetime,
  "updated_at" datetime,
  "tipo_certificado_id" integer,
  "observacion" text,
  foreign key("estudiante_id") references users("id") on delete cascade on update no action,
  foreign key("tipo_certificado_id") references "tipo_certificados"("id") on delete set null
);

INSERT INTO migrations VALUES(1,'0001_01_01_000000_create_users_table',1);
INSERT INTO migrations VALUES(2,'0001_01_01_000001_create_cache_table',1);
INSERT INTO migrations VALUES(3,'0001_01_01_000002_create_jobs_table',1);
INSERT INTO migrations VALUES(4,'2026_02_02_032337_create_permission_tables',1);
INSERT INTO migrations VALUES(5,'2026_02_25_000001_create_periodos_table',1);
INSERT INTO migrations VALUES(6,'2026_02_25_000002_create_cursos_table',1);
INSERT INTO migrations VALUES(7,'2026_02_25_000003_create_materias_table',1);
INSERT INTO migrations VALUES(8,'2026_02_25_000004_create_curso_materia_table',1);
INSERT INTO migrations VALUES(9,'2026_02_25_000005_create_matriculas_table',1);
INSERT INTO migrations VALUES(10,'2026_02_25_000006_create_padre_estudiante_table',1);
INSERT INTO migrations VALUES(11,'2026_02_25_000007_create_notas_table',1);
INSERT INTO migrations VALUES(12,'2026_02_25_000008_create_observaciones_table',1);
INSERT INTO migrations VALUES(13,'2026_02_25_000009_create_actividades_table',1);
INSERT INTO migrations VALUES(14,'2026_02_25_000010_create_entregas_table',1);
INSERT INTO migrations VALUES(15,'2026_02_25_000011_create_horario_bloques_table',1);
INSERT INTO migrations VALUES(16,'2026_02_25_000012_create_mensajes_table',1);
INSERT INTO migrations VALUES(17,'2026_02_25_000013_create_notificaciones_table',1);
INSERT INTO migrations VALUES(18,'2026_02_25_000014_create_pagos_tables',1);
INSERT INTO migrations VALUES(19,'2026_02_25_000015_create_documentos_tables',1);
INSERT INTO migrations VALUES(20,'2026_02_25_000016_add_profile_fields_to_users_table',1);
INSERT INTO migrations VALUES(21,'2026_02_25_000017_add_must_change_password_and_activity_logs',2);
INSERT INTO migrations VALUES(22,'2026_02_25_075759_create_materia_profesor_table',3);
INSERT INTO migrations VALUES(23,'2026_02_26_000001_create_tipo_certificados_table',4);
INSERT INTO migrations VALUES(24,'2026_02_26_100000_add_observacion_to_certificados',5);
