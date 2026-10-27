import { supabase } from './supabase';

// In-memory cache for temporary signed URLs to avoid redundant requests
// Key: photoPath, Value: { url: string, expiresAt: number }
const signedUrlCache = new Map();

/**
 * Retrieves a temporary signed URL for a photo in the private 'item-photos' bucket.
 * Caches results in memory to avoid redundant Supabase API requests.
 *
 * @param {string} photoPath - Relative path stored in item.photo_path
 * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string|null>} Signed URL or null if missing/failed
 */
export async function getItemSignedUrl(photoPath, expiresIn = 3600) {
  if (!photoPath) return null;

  // Check cache (refresh if within 60 seconds of expiration)
  const cached = signedUrlCache.get(photoPath);
  if (cached && Date.now() < cached.expiresAt - 60000) {
    return cached.url;
  }

  try {
    const { data, error } = await supabase.storage
      .from('item-photos')
      .createSignedUrl(photoPath, expiresIn);

    if (error || !data?.signedUrl) {
      // In private buckets or if the object was removed, fail gracefully
      return null;
    }

    // Cache the result
    signedUrlCache.set(photoPath, {
      url: data.signedUrl,
      expiresAt: Date.now() + expiresIn * 1000,
    });

    return data.signedUrl;
  } catch (err) {
    console.warn('[FindIt Storage] Failed to generate signed URL for path:', photoPath, err);
    return null;
  }
}

/**
 * Batch resolves signed URLs for a list of items with photo_path.
 *
 * @param {Array<{ photo_path?: string }>} items
 * @param {number} expiresIn
 * @returns {Promise<Record<string, string>>} Map of photo_path -> signedUrl
 */
export async function batchGetSignedUrls(items, expiresIn = 3600) {
  if (!items || !items.length) return {};

  const urlMap = {};
  const pathsToFetch = [];

  for (const item of items) {
    if (!item.photo_path) continue;
    const cached = signedUrlCache.get(item.photo_path);
    if (cached && Date.now() < cached.expiresAt - 60000) {
      urlMap[item.photo_path] = cached.url;
    } else {
      pathsToFetch.push(item.photo_path);
    }
  }

  if (pathsToFetch.length === 0) {
    return urlMap;
  }

  // Fetch unique uncached paths in parallel
  const uniquePaths = [...new Set(pathsToFetch)];
  await Promise.all(
    uniquePaths.map(async (path) => {
      const url = await getItemSignedUrl(path, expiresIn);
      if (url) {
        urlMap[path] = url;
      }
    })
  );

  return urlMap;
}
