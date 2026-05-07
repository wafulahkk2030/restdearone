DELETE FROM public.payments WHERE memorial_id IN (SELECT id FROM public.memorial_pages WHERE full_name ILIKE 'Lucy Naliaka');
DELETE FROM public.memorial_pages WHERE full_name ILIKE 'Lucy Naliaka';