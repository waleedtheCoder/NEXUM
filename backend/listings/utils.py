from datetime import datetime, timezone


def time_ago(dt):
    """Convert a datetime to a human-readable relative string matching the frontend mock format."""
    if dt is None:
        return ''
    now = datetime.now(timezone.utc)
    # Ensure dt is timezone-aware
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    diff = now - dt
    seconds = int(diff.total_seconds())

    if seconds < 60:
        return 'Just now'
    if seconds < 3600:
        minutes = seconds // 60
        return f'{minutes} minute{"s" if minutes != 1 else ""} ago'
    if seconds < 86400:
        hours = seconds // 3600
        return f'{hours} hour{"s" if hours != 1 else ""} ago'
    if seconds < 172800:
        return 'Yesterday'
    days = seconds // 86400
    if days < 7:
        return f'{days} days ago'
    if days < 14:
        return '1 week ago'
    if days < 30:
        weeks = days // 7
        return f'{weeks} weeks ago'
    return dt.strftime('%b %d')


def get_initials(name):
    """Return up to 2 uppercase initials from a name string."""
    if not name:
        return '?'
    parts = name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return name[0].upper()


def compute_total_value(price, quantity):
    """Return integer total value for display (price * quantity)."""
    try:
        return int(float(price) * int(quantity))
    except (TypeError, ValueError):
        return 0


# Deterministic avatar color based on a user id — cycles through a fixed palette.
_AVATAR_COLORS = ['#00A859', '#F59E0B', '#8B5CF6', '#EC4899', '#10B981', '#3B82F6', '#EF4444']


def avatar_color_for(user_id):
    return _AVATAR_COLORS[int(user_id) % len(_AVATAR_COLORS)]
