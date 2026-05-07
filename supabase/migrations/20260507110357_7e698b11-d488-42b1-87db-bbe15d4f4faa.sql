INSERT INTO public.payments (user_id, memorial_id, amount, currency, status, payment_reference)
SELECT created_by, id, 100, 'KES', 'completed', 'RDO-ADMIN-BYPASS-' || substr(id::text, 1, 8)
FROM public.memorial_pages
WHERE created_by = '8bd30056-3f61-4d9b-930c-7752f01eab7f'
  AND activation_expiry = '2027-05-04 08:44:48.869112+00'
  AND NOT EXISTS (
    SELECT 1 FROM public.payments p
    WHERE p.memorial_id = memorial_pages.id AND p.status = 'completed'
  );

INSERT INTO public.admin_activity_logs (admin_id, action, target_type, target_id, details)
SELECT created_by, 'admin_payment_bypass_activation', 'memorial_page', id,
       jsonb_build_object('reason', 'Admin-seeded memorial — activation granted in lieu of cash payment', 'amount_waived_kes', 100)
FROM public.memorial_pages
WHERE created_by = '8bd30056-3f61-4d9b-930c-7752f01eab7f'
  AND activation_expiry = '2027-05-04 08:44:48.869112+00';