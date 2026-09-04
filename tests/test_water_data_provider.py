from app.services.water_data_provider import WaterDataCache


def test_falls_back_to_simulated_when_no_url_configured():
    cache = WaterDataCache()
    reading = cache.refresh()
    assert reading.source == "SIMULATED"
    assert reading.water_level_m is None


def test_repeated_refresh_stays_simulated_without_a_configured_endpoint():
    cache = WaterDataCache()
    first = cache.refresh()
    second = cache.refresh()
    assert first.source == "SIMULATED"
    assert second.source == "SIMULATED"
