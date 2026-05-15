from django.apps import AppConfig


class UsersConfig(AppConfig):
    name = 'users'

    def ready(self):
        # Enable SQLite WAL mode and performance pragmas on every new connection.
        # WAL allows concurrent reads during writes, eliminating the full-file
        # write-lock that causes request queuing under any load.
        from django.db.backends.signals import connection_created

        def _configure_sqlite(sender, connection, **kwargs):
            if connection.vendor != 'sqlite':
                return
            with connection.cursor() as c:
                c.execute('PRAGMA journal_mode=WAL;')
                # NORMAL: fsync only at checkpoint (safe enough for dev/prod SQLite)
                c.execute('PRAGMA synchronous=NORMAL;')
                # 10 MB page cache (negative value = kibibytes)
                c.execute('PRAGMA cache_size=-10000;')
                # Store temp tables in memory instead of temp files
                c.execute('PRAGMA temp_store=MEMORY;')
                # 128 MB memory-mapped I/O — avoids read() syscalls for hot pages
                c.execute('PRAGMA mmap_size=134217728;')

        connection_created.connect(_configure_sqlite)
