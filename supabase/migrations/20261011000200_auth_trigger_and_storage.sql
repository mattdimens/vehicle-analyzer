-- Objects outside the public schema that the app depends on. Production
-- already has these (created in the dashboard); this makes a fresh project
-- match. Safe to run against a project that already has them.

-- Create a profiles row for every new auth user.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Uploads go through signed upload URLs created with the service role
-- (app/actions.ts), and images are read from public URLs, so the bucket
-- must be public and needs no storage.objects policies.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'vehicle_images',
    'vehicle_images',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
