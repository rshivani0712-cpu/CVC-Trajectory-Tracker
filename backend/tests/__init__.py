import os
# Ensure that all unit tests use an in-memory SQLite database by default
# This must happen before any app modules are imported
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
