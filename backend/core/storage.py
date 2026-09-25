import os
import urllib.error
import urllib.request

SUPABASE_URL         = os.getenv('SUPABASE_URL', '').rstrip('/')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')
SUPABASE_BUCKET      = 'listings'


class StorageNotConfigured(Exception):
    pass


class StorageUploadFailed(Exception):
    pass


def upload_image(data, content_type, object_name):
    """Upload bytes to the public Supabase bucket and return the public URL."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise StorageNotConfigured(
            'Image storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing).'
        )

    req = urllib.request.Request(
        f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{object_name}",
        data=data,
        method='POST',
        headers={
            'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
            'Content-Type':  content_type,
            'x-upsert':      'true',
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            resp.read()
    except urllib.error.HTTPError as exc:
        body = exc.read().decode('utf-8', errors='replace')
        raise StorageUploadFailed(f'Storage upload failed: {body}') from exc

    return f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{object_name}"
