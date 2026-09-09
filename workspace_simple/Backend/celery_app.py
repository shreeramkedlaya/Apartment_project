"""
celery_app.py – Celery application.

Start worker:  celery -A celery_app worker -l info
Start beat:    celery -A celery_app beat -l info
"""

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")

app = Celery("Backend")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f"Request: {self.request!r}")

from celery.schedules import crontab

app.conf.beat_schedule = {
    'process-scheduled-notices-every-minute': {
        'task': 'apt_proj.Apt_Notifications.tasks.process_scheduled_notices',
        'schedule': crontab(minute='*'),
    },
    'cleanup-stale-tokens-weekly': {
        'task': 'apt_proj.Apt_Notifications.tasks.cleanup_stale_device_tokens',
        'schedule': crontab(minute=0, hour=0, day_of_week='sun'),
    },
}
