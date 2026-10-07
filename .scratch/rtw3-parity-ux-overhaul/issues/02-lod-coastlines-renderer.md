# LOD coastlines + Canvas/WebGL renderer

Status: done (Canvas coastline layer, 3 LOD tiers computed lazily at runtime, bbox culling, zoom ceiling 14->60, constant-screen-size markers/labels, non-scaling strokes). Not done: baked tier files, minimap, scale bar (ticket 03)
Frontier: yes
Blocked by: none (spike done, ADR-0055)
Requirements: M-2

## Acceptance
3 coastline resolutions switched by zoom band; interactive at max zoom.
