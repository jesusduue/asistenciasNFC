/*
  Migración de vínculo entre public.usuario y Supabase Auth
  =========================================================
  Ejecutar una sola vez desde Supabase > SQL Editor.

  auth_uid no aparece automáticamente en public.usuario: Supabase Auth
  guarda los UUID en auth.users. Esta columna permite vincular ambas tablas.
*/

begin;

alter table public.usuario
  add column if not exists auth_uid uuid;

create index if not exists usuario_auth_uid_idx
  on public.usuario (auth_uid);

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'usuario_auth_uid_fkey'
       and conrelid = 'public.usuario'::regclass
  ) then
    alter table public.usuario
      add constraint usuario_auth_uid_fkey
      foreign key (auth_uid)
      references auth.users (id)
      on delete set null;
  end if;
end
$$;

comment on column public.usuario.auth_uid is
  'UUID de auth.users.id correspondiente a la cuenta de acceso del usuario';

commit;

/* Verificación: debe mostrar auth_uid con tipo uuid y permitir NULL. */
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'usuario'
  and column_name = 'auth_uid';
