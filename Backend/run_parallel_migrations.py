import concurrent.futures
import subprocess
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent  # backend/ — same dir as manage.py
PYTHON = sys.executable
MANAGE = [PYTHON, str(BASE_DIR / "manage.py")]

# Read configuration from settings.py so this script always follows Django config.
import importlib.util

settings_path = BASE_DIR / "settings.py"
spec = importlib.util.spec_from_file_location("settings", settings_path)
settings = importlib.util.module_from_spec(spec)
spec.loader.exec_module(settings)

DATABASES = list(settings.DATABASES.keys())

# Dynamically discover our local apps from settings
APPS = [
    app for app in settings.INSTALLED_APPS 
    if (BASE_DIR / app).is_dir()
]


def _run(command):
    proc = subprocess.run(command, cwd=BASE_DIR, capture_output=True, text=True)
    return command, proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _print_result(command, code, out, err):
    print(f"\n--> {' '.join(command)}")
    print(f"Exit code: {code}")
    if out:
        print("STDOUT:\n" + out)
    if err:
        print("STDERR:\n" + err)
    if code != 0:
        print("ERROR: command failed, aborting further execution.")
        sys.exit(code)


if __name__ == "__main__":
    print("=" * 60)
    print(f"Dynamically discovered {len(APPS)} internal apps from settings:")
    for app in APPS:
        print(f"  - {app}")
    print("=" * 60)

    # 1) Parallel makemigrations per app
    print("\nRunning makemigrations in parallel...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(APPS)) as executor:
        future_to_cmd = {
            executor.submit(_run, MANAGE + ["makemigrations", app]): app for app in APPS
        }
        for future in concurrent.futures.as_completed(future_to_cmd):
            command, code, out, err = future.result()
            _print_result(command, code, out, err)

    # 2) Parallel migrate per database
    print("\nRunning migrate in parallel for databases:", DATABASES)
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(DATABASES)) as executor:
        future_to_db = {
            executor.submit(_run, MANAGE + ["migrate", "--database", db]): db
            for db in DATABASES
        }
        for future in concurrent.futures.as_completed(future_to_db):
            command, code, out, err = future.result()
            _print_result(command, code, out, err)

    # 3) Normal migrate (without database arg)
    print("\nRunning normal migrate (without --database argument)...")
    command, code, out, err = _run(MANAGE + ["migrate"])
    _print_result(command, code, out, err)

    print("\nDone.")
