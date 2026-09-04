"""
Dynamic Evacuation Routing Engine (section 19).

Roads are modelled as a weighted graph (networkx). Each tick the graph is
rebuilt with live flood-derived road status; a road becomes CLOSED once
flood depth crosses the configured threshold and the routing engine
automatically recalculates paths around it.

The edge weight is NOT pure distance -- it blends:
    safety (flood exposure penalty) + travel time + remaining risk
so a flooded-but-short path is disfavoured versus a longer-but-safe one.
"""
from __future__ import annotations

import networkx as nx

ROAD_AT_RISK_DEPTH_M = 0.3
ROAD_CLOSED_DEPTH_M = 1.0


def road_status(depth_m: float) -> str:
    if depth_m >= ROAD_CLOSED_DEPTH_M:
        return "CLOSED"
    if depth_m >= ROAD_AT_RISK_DEPTH_M:
        return "AT_RISK"
    return "OPEN"


def build_road_states(roads: list[dict], depth_by_road: dict[str, float]) -> list[dict]:
    states = []
    for r in roads:
        depth = depth_by_road.get(r["road_id"], 0.0)
        travel_time_min = round((r["distance_km"] / r["speed_kmph"]) * 60, 1)
        states.append(
            {
                "road_id": r["road_id"],
                "name": r["name"],
                "start_node": r["start_node"],
                "end_node": r["end_node"],
                "distance_km": r["distance_km"],
                "travel_time_min": travel_time_min,
                "flood_depth_m": depth,
                "status": road_status(depth),
                "is_bridge": r.get("is_bridge", False),
            }
        )
    return states


def build_graph(road_states: list[dict], safety_weighted: bool) -> nx.Graph:
    g = nx.Graph()
    for r in road_states:
        if r["status"] == "CLOSED":
            continue  # impassable, excluded entirely
        base = r["travel_time_min"]
        if safety_weighted:
            penalty = {"OPEN": 0.0, "AT_RISK": base * 1.8}[r["status"]]
            weight = base + penalty
        else:
            weight = base
        g.add_edge(r["start_node"], r["end_node"], weight=weight, road_id=r["road_id"], travel_time_min=base)
    return g


def _path_summary(g: nx.Graph, path: list[str]) -> dict:
    total_time = 0.0
    road_ids = []
    for a, b in zip(path, path[1:]):
        edge = g[a][b]
        total_time += edge["weight"]
        road_ids.append(edge["road_id"])
    return {"nodes": path, "road_ids": road_ids, "travel_time_min": round(total_time, 1)}


def find_routes(road_states: list[dict], source: str, target: str) -> dict:
    """Returns current (pre-flood shortest), recommended (safety-weighted), and alternative routes."""
    g_plain = build_graph(road_states, safety_weighted=False)
    g_safe = build_graph(road_states, safety_weighted=True)

    result = {"current": None, "recommended": None, "alternative": None}

    if source not in g_plain or target not in g_plain:
        return result

    try:
        plain_path = nx.shortest_path(g_plain, source, target, weight="weight")
        result["current"] = _path_summary(g_plain, plain_path)
    except nx.NetworkXNoPath:
        result["current"] = None

    if source not in g_safe or target not in g_safe or not nx.has_path(g_safe, source, target):
        result["recommended"] = None
        result["alternative"] = None
        return result

    try:
        paths_gen = nx.shortest_simple_paths(g_safe, source, target, weight="weight")
        paths = []
        for i, p in enumerate(paths_gen):
            paths.append(p)
            if i >= 1:
                break
        if paths:
            result["recommended"] = _path_summary(g_safe, paths[0])
        if len(paths) > 1:
            result["alternative"] = _path_summary(g_safe, paths[1])
    except nx.NetworkXNoPath:
        pass

    return result
