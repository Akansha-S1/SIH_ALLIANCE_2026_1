from app.services.sensor_provider import DemoSensorProvider, SENSOR_IDS


def test_initial_reading_has_all_sensors():
    provider = DemoSensorProvider(seed=1)
    reading = provider.read()
    for sid in SENSOR_IDS:
        assert sid in reading


def test_tick_advances_sim_time_and_updates_history():
    provider = DemoSensorProvider(seed=1)
    provider.tick(1.0, "NORMAL")
    provider.tick(1.0, "NORMAL")
    assert provider.state.sim_minutes == 2.0
    assert len(provider.history("water_level_pct")) == 2


def test_heavy_rainfall_raises_rainfall_over_time():
    provider = DemoSensorProvider(seed=1)
    for _ in range(30):
        provider.tick(1.0, "HEAVY_RAINFALL")
    assert provider.state.rainfall_mm_hr > 15


def test_major_breach_drains_reservoir_and_spikes_vibration():
    provider = DemoSensorProvider(seed=1)
    provider.set_breach_stage(2)
    level_before = provider.state.water_level_pct
    for _ in range(20):
        provider.tick(1.0, "MAJOR_BREACH")
    assert provider.state.water_level_pct < level_before
    assert provider.state.vibration_g > 0.2


def test_correlated_behaviour_structural_anomaly_raises_deformation_and_seepage():
    provider = DemoSensorProvider(seed=7)
    for _ in range(40):
        provider.tick(1.0, "STRUCTURAL_ANOMALY")
    assert provider.state.deformation_mm > 4.0
    assert provider.state.pore_pressure_kpa > 150
