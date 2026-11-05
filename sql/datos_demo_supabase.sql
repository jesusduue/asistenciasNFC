/*
  Datos demo para Asistencia UPTNTS
  =================================
  Este script NO crea ni elimina tablas. Inserta al menos cinco registros en:
  rol, gremio, cargo, personal, usuario, turno, credencial_nfc y asistencia.

  Características:
  - Reejecutable: evita duplicados por nombres, cédulas, UID y combinación persona/turno/fecha.
  - No borra datos existentes ni cambia registros previos.
  - Respeta las relaciones mediante SELECT a partir de claves naturales.
  - usuario.auth_uid queda NULL intencionalmente: debe vincularse después con UUID reales
    de auth.users desde Supabase Auth.
  - No incluye service_role, contraseñas ni claves privadas.

  Requisito esperado del esquema:
  rol(id_rol, nom_rol, desc_rol, est_rol)
  gremio(id_grem, nom_grem, est_grem)
  cargo(id_cargo, nom_cargo, fky_grem, est_cargo)
  personal(id_per, ced_per, nom_per, fky_cargo, est_per)
  usuario(id_usu, nom_usu, auth_uid, fky_rol, fky_per, est_usu)
  turno(id_turno, nom_turno, hora_ini, hora_fin, est_turno)
  credencial_nfc(id_cred, uid_nfc, tok_nfc, fky_per, fec_emision, fec_venc, est_cred, observ)
  asistencia(id_asi, fky_per, fky_turno, fec_asi, hor_lleg, hor_sal, hor_tra, metodo, est_asi, fky_cred)

  Ejecutar desde Supabase SQL Editor con una cuenta administrativa.
*/

begin;

/* --------------------------------------------------------------------------
   1. ROLES — cinco registros
   -------------------------------------------------------------------------- */
insert into public.rol (nom_rol, desc_rol, est_rol)
select datos.nom_rol, datos.desc_rol, 'a'
from (values
  ('admin', 'Acceso total a configuración, catálogos, usuarios y reportes'),
  ('jefeRRHH', 'Gestión de personal, asistencias, credenciales y reportes'),
  ('vigilante', 'Marcaje NFC/manual y consulta de asistencias'),
  ('auditor', 'Consulta de reportes y trazabilidad sin edición'),
  ('supervisor', 'Supervisión operativa de jornadas y turnos')
) as datos(nom_rol, desc_rol)
where not exists (
  select 1 from public.rol r where lower(r.nom_rol) = lower(datos.nom_rol)
);

/* --------------------------------------------------------------------------
   2. GREMIOS — cinco registros
   -------------------------------------------------------------------------- */
insert into public.gremio (nom_grem, est_grem)
select datos.nom_grem, 'a'
from (values
  ('Docente'),
  ('Administrativo'),
  ('Obrero'),
  ('Vigilancia'),
  ('Contratado')
) as datos(nom_grem)
where not exists (
  select 1 from public.gremio g where lower(g.nom_grem) = lower(datos.nom_grem)
);

/* --------------------------------------------------------------------------
   3. CARGOS — cinco registros relacionados con gremio
   -------------------------------------------------------------------------- */
insert into public.cargo (nom_cargo, fky_grem, est_cargo)
select datos.nom_cargo, gremio.id_grem, 'a'
from (values
  ('Profesor agregado', 'Docente'),
  ('Analista administrativo', 'Administrativo'),
  ('Auxiliar de servicios', 'Obrero'),
  ('Oficial de vigilancia', 'Vigilancia'),
  ('Especialista contratado', 'Contratado')
) as datos(nom_cargo, nom_grem)
join public.gremio gremio on lower(gremio.nom_grem) = lower(datos.nom_grem)
where not exists (
  select 1 from public.cargo c where lower(c.nom_cargo) = lower(datos.nom_cargo)
);

/* --------------------------------------------------------------------------
   4. PERSONAL — cinco registros relacionados con cargo
   -------------------------------------------------------------------------- */
insert into public.personal (ced_per, nom_per, fky_cargo, est_per)
select datos.ced_per, datos.nom_per, cargo.id_cargo, 'a'
from (values
  ('V-12000001', 'María González', 'Profesor agregado'),
  ('V-12000002', 'Carlos Rodríguez', 'Analista administrativo'),
  ('V-12000003', 'Ana Pérez', 'Auxiliar de servicios'),
  ('V-12000004', 'José Martínez', 'Oficial de vigilancia'),
  ('V-12000005', 'Luisa Hernández', 'Especialista contratado')
) as datos(ced_per, nom_per, nom_cargo)
join public.cargo cargo on lower(cargo.nom_cargo) = lower(datos.nom_cargo)
where not exists (
  select 1 from public.personal p where lower(p.ced_per) = lower(datos.ced_per)
);

/* --------------------------------------------------------------------------
   5. TURNOS — cinco registros
   -------------------------------------------------------------------------- */
insert into public.turno (nom_turno, hora_ini, hora_fin, est_turno)
select datos.nom_turno, datos.hora_ini::time, datos.hora_fin::time, 'a'
from (values
  ('Diurno', '07:00', '15:00'),
  ('Vespertino', '12:00', '20:00'),
  ('Administrativo', '08:00', '16:00'),
  ('Nocturno', '20:00', '23:59'),
  ('Mixto', '09:00', '17:00')
) as datos(nom_turno, hora_ini, hora_fin)
where not exists (
  select 1 from public.turno t where lower(t.nom_turno) = lower(datos.nom_turno)
);

/* --------------------------------------------------------------------------
   6. USUARIOS — cinco registros relacionados con rol y personal

   auth_uid queda NULL porque no se deben inventar UUID de auth.users.
   Después de crear las cuentas en Authentication, vincula cada fila con:
   update public.usuario
      set auth_uid = '<UUID_REAL_DE_AUTH_USERS>'
    where nom_usu = '<USUARIO>';
   -------------------------------------------------------------------------- */
insert into public.usuario (nom_usu, fky_rol, fky_per, est_usu)
select datos.nom_usu, rol.id_rol, personal.id_per, 'a'
from (values
  ('admin.demo', 'admin', 'V-12000001'),
  ('rrhh.demo', 'jefeRRHH', 'V-12000002'),
  ('vigilancia.demo', 'vigilante', 'V-12000004'),
  ('auditoria.demo', 'auditor', 'V-12000005'),
  ('supervision.demo', 'supervisor', 'V-12000003')
) as datos(nom_usu, nom_rol, ced_per)
join public.rol rol on lower(rol.nom_rol) = lower(datos.nom_rol)
join public.personal personal on lower(personal.ced_per) = lower(datos.ced_per)
where not exists (
  select 1 from public.usuario u where lower(u.nom_usu) = lower(datos.nom_usu)
);

/* --------------------------------------------------------------------------
   7. CREDENCIALES NFC — cinco registros relacionados con personal

   Los UID son valores demo. tok_nfc se incluye porque forma parte del esquema
   descrito, pero la aplicación nunca lo muestra en la interfaz.
   -------------------------------------------------------------------------- */
insert into public.credencial_nfc
  (uid_nfc, tok_nfc, fky_per, fec_emision, fec_venc, est_cred, observ)
select datos.uid_nfc,
       datos.tok_nfc,
       personal.id_per,
       current_date - datos.días_antiguedad,
       current_date + datos.días_vigencia,
       'a',
       'Credencial demo generada por datos_demo_supabase.sql'
from (values
  ('04A1B2C3D401', 'demo-token-uptnts-001', 'V-12000001', 30, 335),
  ('04A1B2C3D402', 'demo-token-uptnts-002', 'V-12000002', 25, 300),
  ('04A1B2C3D403', 'demo-token-uptnts-003', 'V-12000003', 20, 270),
  ('04A1B2C3D404', 'demo-token-uptnts-004', 'V-12000004', 15, 240),
  ('04A1B2C3D405', 'demo-token-uptnts-005', 'V-12000005', 10, 210)
) as datos(uid_nfc, tok_nfc, ced_per, días_antiguedad, días_vigencia)
join public.personal personal on lower(personal.ced_per) = lower(datos.ced_per)
where not exists (
  select 1 from public.credencial_nfc c where upper(c.uid_nfc) = upper(datos.uid_nfc)
);

/* --------------------------------------------------------------------------
   8. ASISTENCIAS — cinco registros relacionados con personal, turno y NFC

   No se inserta hor_tra: normalmente es calculado por la base mediante trigger
   o columna generada a partir de hor_lleg y hor_sal.
   -------------------------------------------------------------------------- */
insert into public.asistencia
  (fky_per, fky_turno, fec_asi, hor_lleg, hor_sal, metodo, est_asi, fky_cred)
select personal.id_per,
       turno.id_turno,
       current_date - datos.días_atras,
       (current_date - datos.días_atras)::timestamp + datos.hora_llegada::time,
       case when datos.hora_salida is null then null else (current_date - datos.días_atras)::timestamp + datos.hora_salida::time end,
       datos.metodo,
       'a',
       credencial.id_cred
from (values
  ('V-12000001', 'Diurno', '08:02', '15:04', 0, 'nfc', '04A1B2C3D401'),
  ('V-12000002', 'Administrativo', '08:10', '16:02', 1, 'nfc', '04A1B2C3D402'),
  ('V-12000003', 'Diurno', '07:58', '15:00', 2, 'manual', '04A1B2C3D403'),
  ('V-12000004', 'Vespertino', '12:05', '20:01', 3, 'nfc', '04A1B2C3D404'),
  ('V-12000005', 'Mixto', '09:12', null, 4, 'manual', '04A1B2C3D405')
) as datos(ced_per, nom_turno, hora_llegada, hora_salida, días_atras, metodo, uid_nfc)
join public.personal personal on lower(personal.ced_per) = lower(datos.ced_per)
join public.turno turno on lower(turno.nom_turno) = lower(datos.nom_turno)
join public.credencial_nfc credencial on upper(credencial.uid_nfc) = upper(datos.uid_nfc)
where not exists (
  select 1
    from public.asistencia existente
   where existente.fky_per = personal.id_per
     and existente.fky_turno = turno.id_turno
     and existente.fec_asi = current_date - datos.días_atras
);

commit;

/* Comprobación rápida: cada consulta debe devolver al menos 5. */
select 'rol' as tabla, count(*) as total from public.rol
union all select 'gremio', count(*) from public.gremio
union all select 'cargo', count(*) from public.cargo
union all select 'personal', count(*) from public.personal
union all select 'usuario', count(*) from public.usuario
union all select 'turno', count(*) from public.turno
union all select 'credencial_nfc', count(*) from public.credencial_nfc
union all select 'asistencia', count(*) from public.asistencia
order by tabla;
