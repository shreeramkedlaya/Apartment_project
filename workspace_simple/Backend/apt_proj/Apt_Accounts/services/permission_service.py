import os
import json
from django.conf import settings

_CACHED_PERMISSIONS = None

def load_all_permission_ids():
    """Read permissions.json (or return cached) and return a flat list of all string IDs."""
    global _CACHED_PERMISSIONS
    if _CACHED_PERMISSIONS is not None:
        return _CACHED_PERMISSIONS
        
    try:
        json_path = os.path.join(settings.BASE_DIR, 'permissions.json')
        with open(json_path, 'r') as f:
            tree = json.load(f)

        ids = []
        def collect(nodes):
            for node in nodes:
                ids.append(node['id'])
                if 'children' in node:
                    collect(node['children'])
        collect(tree)
        _CACHED_PERMISSIONS = ids
        return ids
    except Exception:
        return []
