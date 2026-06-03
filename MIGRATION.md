# Migration guide — v1 to v2

## Overview

v2 contains three breaking changes and two additive changes. The breaking changes were made to align the library more closely with RFC 7946 and to surface incorrect behaviour that was previously silent.

---

## Breaking changes

### 1. `distance()` default formula changed from `cartesian` to `haversine`

**What changed:** Calling `distance(a, b)` without a formula argument now uses `haversine` instead of `cartesian`.

**Why:** The `cartesian` formula treats longitude/latitude as a flat Cartesian plane. This is mathematically valid only for very small areas near the equator. For any real-world distance it produces results that are badly wrong — and silently so. Amsterdam to New York is a good illustration:

| formula | result | error |
|---------|--------|-------|
| `cartesian` | ~8 829 km | **+51%** |
| `haversine` | ~5 848 km | <0.1% |
| `vincenty` | ~5 863 km | reference |
| `karney` | ~5 863 km | reference |

`haversine` is accurate enough for almost all use cases and is only marginally slower than `cartesian`. It is a better default by any measure.

**How to fix:**

If you are already passing a formula explicitly, no change is needed.

If you relied on the default and want to preserve the old behaviour, the two best options are:

**Option A — be explicit at the call site:**
```ts
distance(a, b, 'cartesian')
```

**Option B — import the formula as your distance function (zero call-site changes):**
```ts
import { cartesian as distance } from '@konfirm/geojson';

distance(a, b); // still cartesian, unchanged behaviour everywhere
```

Option B is particularly useful when `distance` is called in many places — rename the import once and nothing else needs to change.

**Option C — wrap it (less ideal, but valid for gradual migration):**
```ts
import { distance as geojsonDistance } from '@konfirm/geojson';

const distance = (a, b) => geojsonDistance(a, b, 'cartesian');
```

This is useful if you need to keep the original `distance` name in scope for other reasons, or if you are migrating a large codebase incrementally and want to mark the old behaviour explicitly before deciding which calls to upgrade.

**While you are here — consider switching to a better formula:**

If you are using `cartesian` for performance, note that `haversine` is only a few microseconds slower per call and orders of magnitude more accurate. Unless you are calculating distances within a few hundred metres near the equator, `haversine` is the right choice. For near-antipodal inputs — points on nearly opposite sides of the Earth — or when every nanometre counts, use `karney`.

---

### 2. `isStrictPolygon` now enforces RFC 7946 winding

**What changed:** `isStrictPolygon` (and all `isStrict*` guards that include polygon validation) now rejects polygons whose rings have incorrect winding order. [RFC 7946 §3.1.6](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1) requires exterior rings to be counterclockwise (CCW) and interior rings (holes) to be clockwise (CW).

**Why:** RFC 7946 uses `MUST` for winding requirements, making it a compliance issue, not a style preference. The v1 implementation had the winding formula inverted, so the check was both unenforced and wrong — wrong formula, wrong test data, consistent with each other, tests green. Nearly every public GeoJSON validator ignores winding entirely; `isStrictPolygon` is one of the few that enforces it. [Read the full account of how this happened and what was done to prevent it.](./docs/adr-winding-and-test-data.md)

**Impact:** Most real-world GeoJSON datasets use the older Shapefile/right-hand-rule convention (CW exterior rings), including Natural Earth and most GIS exports. These will fail strict validation in v2.

**How to fix:**

If you do not need strict validation, switch to the loose guard:
```ts
// before
isStrictPolygon(feature)

// after — accepts any winding
isPolygon(feature)
```

If you want strict validation, ensure your data uses RFC 7946 winding. Exterior rings must be counterclockwise; interior rings (holes) must be clockwise. Most GIS tools have an option to normalise winding on export.

---

### 3. `vincenty` throws for near-antipodal inputs

**What changed:** Calling `distance(a, b, 'vincenty')` (or `vincenty(a, b)`) with near-antipodal coordinates now throws `EvalError('Vincenty formula failed to converge')` instead of returning a silently wrong value.

**Why:** Vincenty's iterative formula does not converge (never settles on a stable answer) for points near the antipode. In v1 it returned a value that could be up to ~3.7 km wrong without any indication of failure. The v2 behaviour makes the failure explicit so callers can handle it.

**How to fix:**

Wrap near-antipodal calls in a try/catch and fall back to `karney`:
```ts
import { distance } from '@konfirm/geojson';

function safeDistance(a, b) {
    try {
        return distance(a, b, 'vincenty');
    } catch {
        return distance(a, b, 'karney');
    }
}
```

Or switch to `karney` unconditionally — it always converges and is more accurate:
```ts
// before
distance(a, b, 'vincenty')

// after — always converges, ~15 nm accuracy on WGS84
distance(a, b, 'karney')
```

---

## Additive changes (no action required)

### `karney` formula

A fourth formula `'karney'` is now available, implementing Karney's geodesic algorithm. It always converges (including antipodal points) and achieves ~15 nm accuracy on WGS84. Use it when correctness matters more than raw speed, or whenever inputs may be near-antipodal.

```ts
distance(a, b, 'karney')
```

### Formula functions exported directly

Each formula is now also exported as a standalone GeoJSON-level function. These can be imported and called directly, and allow bundlers to tree-shake unused formulas:

```ts
import { cartesian, haversine, vincenty, karney } from '@konfirm/geojson';

karney(a, b);    // same as distance(a, b, 'karney')
haversine(a, b); // same as distance(a, b, 'haversine')
```
