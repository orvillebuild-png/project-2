with visuals(name, image_url, image_alt) as (
  values
    ('Gala Fundraiser', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80', 'Formal gala dinner table'),
    ('Volunteer Orientation', 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=80', 'Volunteers working together'),
    ('Community Outreach Day', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80', 'Community outreach volunteers'),
    ('Donor Appreciation Dinner', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80', 'Warm dinner gathering'),
    ('Board Meeting Notice', 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80', 'Board meeting discussion'),
    ('Workshop Registration', 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80', 'Workshop group session'),
    ('Webinar Invite', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80', 'Online webinar laptop'),
    ('Faith Gathering', 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80', 'Church gathering candles'),
    ('School Reunion', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80', 'Friends reunited together'),
    ('Product Launch', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80', 'Modern launch workspace'),
    ('Charity Auction', 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=1200&q=80', 'Art gallery auction'),
    ('Medical Mission', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80', 'Healthcare mission team'),
    ('Holiday Celebration', 'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=1200&q=80', 'Holiday celebration lights'),
    ('Conference Pass', 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80', 'Conference audience'),
    ('Modern Wedding Invitation', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80', 'Wedding aisle with flowers')
)
update public.email_templates templates
set design_data = jsonb_set(
    jsonb_set(templates.design_data, '{image_url}', to_jsonb(visuals.image_url), true),
    '{image_alt}', to_jsonb(visuals.image_alt), true
  ),
  updated_at = now()
from visuals
where templates.name = visuals.name
  and templates.is_library_template = true;
