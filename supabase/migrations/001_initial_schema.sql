-- ==============================================================================
-- FindIt — Smart Campus Lost & Found Platform
-- Migration 001: Initial Database Schema, Triggers, RLS & Storage Policies
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. TABLES DEFINITION
-- ------------------------------------------------------------------------------

-- PROFILES TABLE
-- Mirrors auth.users and tracks campus user role ('student' or 'admin')
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ITEMS TABLE
-- Stores lost and found reports submitted by students
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('lost', 'found')),
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    category TEXT NOT NULL CHECK (length(trim(category)) > 0),
    description TEXT NOT NULL CHECK (length(trim(description)) > 0),
    location TEXT NOT NULL CHECK (length(trim(location)) > 0),
    date_incident DATE NOT NULL DEFAULT CURRENT_DATE,
    photo_path TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'returned', 'moderated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- CLAIMS TABLE
-- Stores ownership claims submitted for found items
CREATE TABLE IF NOT EXISTS public.claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    claimant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    proof_description TEXT NOT NULL CHECK (length(trim(proof_description)) > 0),
    contact_details TEXT NOT NULL CHECK (length(trim(contact_details)) > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES & INTEGRITY CONSTRAINTS
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_items_user_id ON public.items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_type_status ON public.items(type, status);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category);
CREATE INDEX IF NOT EXISTS idx_items_location ON public.items(location);
CREATE INDEX IF NOT EXISTS idx_items_date_incident ON public.items(date_incident);

CREATE INDEX IF NOT EXISTS idx_claims_item_id ON public.claims(item_id);
CREATE INDEX IF NOT EXISTS idx_claims_claimant_id ON public.claims(claimant_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON public.claims(status);

-- Partial Unique Index: Prevent duplicate pending claims for the same item by the same user
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_claim_per_user 
ON public.claims(item_id, claimant_id) 
WHERE (status = 'pending');

-- Partial Unique Index: Prevent conflicting approved claims (only 1 approved claim per item)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_approved_claim_per_item 
ON public.claims(item_id) 
WHERE (status = 'approved');

-- ------------------------------------------------------------------------------
-- 4. AUTOMATED TIMESTAMP & PROFILE TRIGGERS
-- ------------------------------------------------------------------------------

-- Update updated_at timestamp on items automatically
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_items_updated_at ON public.items;
CREATE TRIGGER tr_items_updated_at
BEFORE UPDATE ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Automatically create student profile on auth.users registration
-- Always enforces role = 'student' to avoid client-side role forgery
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'student'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 5. SECURE ADMIN HELPER FUNCTION & ROLE ELEVATION PROTECTION
-- ------------------------------------------------------------------------------

-- Non-recursive helper to check if current authenticated user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- Protect role column: prevent users from self-promoting to admin via direct UPDATE
CREATE OR REPLACE FUNCTION public.prevent_role_self_elevation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.role <> OLD.role THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Access denied: Only existing administrators can modify user roles.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_prevent_role_self_elevation ON public.profiles;
CREATE TRIGGER tr_prevent_role_self_elevation
BEFORE UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_self_elevation();

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 6.1 PROFILES POLICIES
-- ------------------------------------------------------------------------------

-- Anyone (public or authenticated) can view basic profile info (display names for item reporters)
DROP POLICY IF EXISTS "Profiles viewable publicly" ON public.profiles;
CREATE POLICY "Profiles viewable publicly"
ON public.profiles
FOR SELECT
TO public
USING (true);

-- Authenticated users can update their own profile (name, etc. - role elevation blocked by trigger)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 6.2 ITEMS POLICIES
-- ------------------------------------------------------------------------------

-- Unmoderated items are viewable by everyone. Moderated items only visible to owner or admin.
DROP POLICY IF EXISTS "Items visible to public unless moderated" ON public.items;
CREATE POLICY "Items visible to public unless moderated"
ON public.items
FOR SELECT
TO public
USING (
    status != 'moderated'
    OR (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR public.is_admin()))
);

-- Authenticated users can create reports only for themselves with initial status 'active'
DROP POLICY IF EXISTS "Authenticated users can create items" ON public.items;
CREATE POLICY "Authenticated users can create items"
ON public.items
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
    AND status = 'active'
);

-- Owners can edit their active or claimed items (cannot moderate or set returned)
DROP POLICY IF EXISTS "Owners can update own active items" ON public.items;
CREATE POLICY "Owners can update own active items"
ON public.items
FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id
    AND status IN ('active', 'claimed')
)
WITH CHECK (
    auth.uid() = user_id
    AND status IN ('active', 'claimed')
);

-- Admins can update any item (moderate, return, resolve)
DROP POLICY IF EXISTS "Admins have full update access to items" ON public.items;
CREATE POLICY "Admins have full update access to items"
ON public.items
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Owners can delete their active items; admins can delete any item
DROP POLICY IF EXISTS "Owners and admins can delete items" ON public.items;
CREATE POLICY "Owners and admins can delete items"
ON public.items
FOR DELETE
TO authenticated
USING (
    (auth.uid() = user_id AND status = 'active')
    OR public.is_admin()
);

-- ------------------------------------------------------------------------------
-- 6.3 CLAIMS POLICIES
-- ------------------------------------------------------------------------------

-- Claim details are private: strictly accessible ONLY to the claimant or an administrator
DROP POLICY IF EXISTS "Claims viewable only by claimant or admin" ON public.claims;
CREATE POLICY "Claims viewable only by claimant or admin"
ON public.claims
FOR SELECT
TO authenticated
USING (
    auth.uid() = claimant_id
    OR public.is_admin()
);

-- Authenticated users can submit a claim for an active found item they do not own
DROP POLICY IF EXISTS "Authenticated users can submit claims for active found items" ON public.claims;
CREATE POLICY "Authenticated users can submit claims for active found items"
ON public.claims
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = claimant_id
    AND status = 'pending'
    AND EXISTS (
        SELECT 1 FROM public.items
        WHERE items.id = item_id
          AND items.type = 'found'
          AND items.status = 'active'
          AND items.user_id != auth.uid()
    )
);

-- ONLY administrators can update claims (approve, reject, add notes)
DROP POLICY IF EXISTS "Only admins can review and update claims" ON public.claims;
CREATE POLICY "Only admins can review and update claims"
ON public.claims
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Claimants can withdraw pending claims, or admins can delete claims
DROP POLICY IF EXISTS "Claimants can withdraw pending claims" ON public.claims;
CREATE POLICY "Claimants can withdraw pending claims"
ON public.claims
FOR DELETE
TO authenticated
USING (
    (auth.uid() = claimant_id AND status = 'pending')
    OR public.is_admin()
);

-- ------------------------------------------------------------------------------
-- 7. STORAGE BUCKET CONFIGURATION & POLICIES (item-photos)
-- ------------------------------------------------------------------------------

-- Create private bucket 'item-photos' if it doesn't already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-photos', 'item-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Authenticated users can upload photographs strictly into their own folder:
-- Folder structure enforced: item-photos/{auth.uid()}/{filename}
DROP POLICY IF EXISTS "Users can upload item photos to own folder" ON storage.objects;
CREATE POLICY "Users can upload item photos to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'item-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update or replace their own photographs in their folder
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
CREATE POLICY "Users can update own photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'item-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'item-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Read access to photographs:
-- Authenticated users or signed URL generators can view images stored in item-photos
DROP POLICY IF EXISTS "Photos viewable by authenticated users" ON storage.objects;
CREATE POLICY "Photos viewable by authenticated users"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'item-photos'
);

-- Policy: Users can delete their own photographs; admins can delete any photograph
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
CREATE POLICY "Users can delete own photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'item-photos'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_admin()
    )
);
