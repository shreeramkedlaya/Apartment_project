from pathlib import Path

import firebase_admin
from django.conf import settings
from firebase_admin import credentials


def initialize_firebase() -> None:
    if firebase_admin._apps:
        return

    firebase_key_path = Path(settings.BASE_DIR) / settings.FIREBASE_KEY_PATH

    if not firebase_key_path.exists():
        raise FileNotFoundError(
            f"Firebase credentials file not found: {firebase_key_path}"
        )

    credentials_certificate = credentials.Certificate(
        str(firebase_key_path)
    )

    firebase_admin.initialize_app(credentials_certificate)