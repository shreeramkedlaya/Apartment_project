"""
BackgroundRunner — Fire-and-forget background thread utility.

Use this for any non-blocking operation where the HTTP response
must be returned immediately (CDN uploads, email sends, feed rebuilds).
"""
import logging
import threading

logger = logging.getLogger(__name__)

def run_in_background(func, *args, **kwargs) -> threading.Thread:
    """
    Run func(*args, **kwargs) in a daemon thread.
    Returns immediately — caller gets HTTP response without waiting.
    Any exception inside func is caught and logged silently.
    """
    def _safe():
        try:
            func(*args, **kwargs)
        except Exception as exc:
            logger.error(
                "[BackgroundRunner] %s raised: %s",
                getattr(func, '__name__', repr(func)),
                exc,
                exc_info=True,
            )

    t = threading.Thread(target=_safe, daemon=True, name=f"bg-{getattr(func, '__name__', 'task')}")
    t.start()
    return t
