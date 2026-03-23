-- Fix pending payments - mark as completed
UPDATE payments SET status = 'completed' WHERE memorial_id = 'ef80fa02-e4d3-4479-9bb2-5469f1012524' AND status = 'pending';

-- Activate memorial pages
UPDATE memorial_pages SET status = 'active', activation_expiry = (NOW() + INTERVAL '1 year') WHERE id = 'ef80fa02-e4d3-4479-9bb2-5469f1012524';
UPDATE memorial_pages SET status = 'active', activation_expiry = (NOW() + INTERVAL '1 year') WHERE id = '5ae89495-61a7-4929-988b-e47e19e57b86';