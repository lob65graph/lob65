# LOB65

Experimental graph-based environment for the visualization and analysis of astrological configurations.

LOB65 explores graph-theoretical and topological approaches as complementary methods for studying natal and transit structures.

In the system:

- planets and points become nodes
- aspects become edges
- graph algorithms extract structural and relational properties

The project focuses on:

- connectivity
- activation patterns
- weighted relational models
- graph topology
- structural transitions between natal and transit states

Rather than replacing traditional astrological techniques, LOB65 investigates how network analysis and graph visualization can provide additional structural perspectives on chart analysis.

---

## Features

### Astrological Modeling

- Natal graph generation
- Transit overlay system
- Dynamic aspect detection
- Near-miss aspect detection
- Configurable orb systems
- Weighted and unweighted relational models

### Graph Analysis

- Betweenness centrality
- k-core decomposition
- Connected components
- Articulation points (cut vertices)
- Fiedler λ₂ (algebraic connectivity)
- Density metrics
- Main component analysis

### Visualization

- Interactive D3.js force graph
- Zoom and pan
- Aspect filtering
- Edge-weight filtering
- Overlay highlighting
- Dynamic graph updates

### Persistence

- Theme save/load
- Transit set save/load
- JSON export/import
- LocalStorage persistence

---

## Project Structure

```text
index.html
style.css
app.js
graph.js
metrics.js
render.js
ui.js
```

| File | Responsibility |
|---|---|
| `graph.js` | Graph construction and algorithms |
| `metrics.js` | Derived metrics and comparative calculations |
| `render.js` | D3 rendering and graph/UI updates |
| `ui.js` | Controls, themes, persistence, import/export |
| `app.js` | Application orchestration |

All `.js` files currently share the global browser scope (no `type="module"`).

Script inclusion order in `index.html` is therefore important.

---

## Quick Start

1. Open `index.html` in a modern browser.
2. Internet connection is required for the D3.js CDN.
3. Press `↺ LOB11 preset` to load the example configuration.
4. Press `▶ COMPUTE` to generate the graph.
5. Modify planets, transits, filters, and orb settings as desired, then recompute.

Alternatively, run a lightweight local server:

```bash
python -m http.server
```

Then open:

```text
http://localhost:8000
```

---

## Documentation

Complete documentation is available here:

- [User Manual](/user-manual.md)

---

## Main Controls

| Control | Function |
|---|---|
| `↺ LOB11 preset` | Loads the example configuration |
| `⬚ New` | Loads an empty template |
| `✕ Clear all` | Clears planets and graph |
| `▶ COMPUTE` | Runs graph construction, metrics, and rendering |
| `⚖ Weighted / Unweighted` | Toggles weighted vs topological visualization |

---

## Implemented Algorithms

### Graph Construction

- Geometric aspect detection with configurable orbs
- Dynamic transit overlay construction
- Weighted edge generation

### Graph Metrics

- k-core decomposition
- Betweenness centrality
- Connected component detection
- Articulation point detection (Tarjan DFS)
- Fiedler λ₂ computation from graph Laplacian
- Density and main-component metrics

### Weighted Model

Edge weights are computed from:

- normalized orb distance
- aspect coefficient
- retrograde modifier
- selected weighting curve

Available weighting curves:

- Linear
- Exponential
- Threshold

Optional logarithmic path cost is also supported.

---

## Customization

The system allows configurable:

- aspect orbs
- weighting curves
- retrograde factor
- weight thresholds
- aspect filtering
- weighted/unweighted analysis mode

The `UNIFORM ASPECT ORBS` panel allows editing maximum orb values for each aspect class.

---

## Report Export

The application can generate `.txt` reports containing:

- graph metrics
- betweenness rankings
- edge lists
- aspect weights
- near misses
- natal/transit edge lists
- configuration parameters

---

## Status

Experimental / research-oriented project.

The codebase evolved incrementally as an exploratory system and remains under active structural refinement.

The project focuses on:

- astrological structural modeling
- graph topology
- symbolic-system visualization
- exploratory relational analysis

---

## Contributing

Contributions related to:

- astrological modeling
- graph analysis
- topology
- visualization
- interaction systems
- symbolic-system modeling
- D3 optimization

are welcome through issues or pull requests.

---

## Credits

- [D3.js](https://d3js.org) — Data-Driven Documents by Mike Bostock, released under the ISC license.

---

## License

This project is released under the MIT License.

See the `LICENSE` file for details.

