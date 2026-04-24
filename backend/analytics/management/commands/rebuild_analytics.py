from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Rebuild all analytics caches: embeddings, market snapshots, forecasts, top products.'

    def handle(self, *args, **options):
        from analytics.services.embeddings import build_index
        from analytics.services.market import rebuild_snapshots, rebuild_top_products
        from analytics.services.forecast import rebuild_forecasts

        self.stdout.write('Building embedding index...')
        docs = build_index(force=True)
        self.stdout.write(f'  Indexed {docs} listings.')

        self.stdout.write('Rebuilding market snapshots...')
        snaps = rebuild_snapshots()
        self.stdout.write(f'  Updated {snaps} snapshot rows.')

        self.stdout.write('Rebuilding top products...')
        rebuild_top_products()

        self.stdout.write('Rebuilding demand forecasts...')
        forecasts = rebuild_forecasts()
        self.stdout.write(f'  Computed {forecasts} forecast rows.')

        self.stdout.write(self.style.SUCCESS('Analytics rebuild complete.'))
