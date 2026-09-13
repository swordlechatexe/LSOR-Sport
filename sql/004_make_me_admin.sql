-- À exécuter APRÈS avoir créé ton compte sur le site (page /inscription).
-- Remplace l'email par le tien, puis Run.

update public.profiles
set is_admin = true
where id = (select id from auth.users where email = 'TON_EMAIL_ICI@exemple.fr');
