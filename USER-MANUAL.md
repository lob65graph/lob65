# LOB65 Complete User Manual

# Introduction

LOB65 is an experimental graph-based environment for the visualization and analysis of astrological configurations.

The application transforms astrological structures into network graphs:

- planets and points become nodes
- aspects become edges
- aspect strength becomes edge weight

The goal is not to replace traditional astrology, but to provide an additional structural layer for studying:

- connectivity
- centrality
- clustering
- structural bottlenecks
- weighted propagation
- graph topology

LOB65 can be used for:

- natal charts
- transit overlays
- synthetic aspect structures
- experimental graph analysis
- secondary progressions as standalone natal charts

---

# PART I — GETTING STARTED

# Interface Overview

The interface is divided into three main sections.

## Left Panel

Contains:

- planet input table
- orb settings
- transit input
- saved themes
- saved transit sets

This is where chart data is entered and configured.

---

## Center Panel

Displays the graph visualization.

Features:

- draggable nodes
- weighted aspect lines
- graph layout simulation
- legend and status information

The graph updates after computation.

---

## Right Panel

Contains analysis results.

Includes:

- graph metrics
- node metrics
- edge lists
- near misses
- connectivity data
- centrality values

This section is the analytical core of the application.

---

# Basic Workflow

Typical usage:

1. Enter planets and positions
2. Configure orbs and weighting model
3. Press COMPUTE
4. Explore graph structure and metrics
5. Save the theme if needed

---

# PART II — ENTERING CHART DATA

# Planet Table

Each row represents a planet or point.

Fields:

| Field | Meaning |
|---|---|
| Name | Planet or point label |
| Sign | Zodiac sign |
| Deg | Degree |
| Min | Arc minutes |
| Type | Object category |
| R | Retrograde flag |

Example:

| Name | Sign | Deg | Min |
|---|---|---|---|
| Sun | Aquarius | 23 | 32 |

---

# Planet Types

The Type field classifies objects.

Examples:

| Type | Usage |
|---|---|
| luminary | Sun, Moon |
| personal | Mercury, Venus, Mars |
| social | Jupiter, Saturn |
| outer | Uranus, Neptune, Pluto |
| point | ASC, MC, Nodes, etc. |

Types affect:

- node coloring
- grouping
- analytical filters

---

# Retrograde Flag

The checkbox marks a body as retrograde.

This does not directly change graph topology.
It is stored for visualization and future analytical extensions.

---

# Clearing the Chart

Use:

- CLEAR ALL

to remove:

- planets
- graph
- metrics
- analysis output

---

# PART III — ORBS AND ASPECTS

# Orb System

LOB65 uses configurable orb limits.

Each aspect type can have its own maximum orb.

Examples:

| Aspect | Example Orb |
|---|---|
| Conjunction | 8° |
| Opposition | 8° |
| Trine | 6° |
| Square | 6° |
| Sextile | 4° |

An aspect exists only if:

actual orb ≤ allowed orb

---

# Orb Controls

The Orb panel allows editing orb values for each aspect.

Available functions:

- reset to default
- reset to classic values
- custom orb tuning

Changing orb values directly changes:

- detected edges
- graph density
- connectivity structure

---

# Near Misses

The application can display near aspects.

These are configurations that:

- narrowly fail orb requirements
- are close to becoming active edges

Useful for:

- transit monitoring
- activation studies
- threshold analysis

---

# PART IV — WEIGHT SYSTEM, CURVES, COSTS AND FILTERS

# SIMPLE EXPLANATION

# What is a Weight?

When the program finds an aspect, it also calculates how strong that aspect should be inside the graph.

This value is called the weight.

Examples:

- exact aspect → high weight
- wide orb aspect → lower weight

The selected curve controls how fast the weight decreases.

---

# Linear

Strength decreases gradually and evenly.

Practical effect:

- wide aspects still contribute
- the graph stays broadly connected
- many relationships remain visible

Use when:

- you want a balanced representation.

---

# Exponential

Strength decreases very quickly.

Tight aspects dominate.
Wide aspects weaken rapidly.

Practical effect:

- exact aspects become dominant
- the graph concentrates around precise configurations

Use when:

- you want precision and strictness.

---

# Threshold

An aspect is either:

- active
- inactive

Below the threshold:

- full strength

Above the threshold:

- no connection

Practical effect:

- graph structure changes abruptly
- small movements can create or destroy links

Use when:

- you want an ON/OFF model.

---

# k-exp

`k-exp` works only with Exponential mode.

It controls how fast aspect strength decays.

| k-exp | Behavior |
|---|---|
| 1 | permissive |
| 2–3 | balanced |
| 5–6 | very strict |

---

# thr-point

`thr-point` works only with Threshold mode.

It defines where the cutoff occurs.

Example:

- square orb limit = 8°
- thr-point = 0.5

Result:

- up to 4° → aspect active
- beyond 4° → aspect removed

---

# log-cost

`log-cost` changes how the program calculates pathways through the graph.

Without log-cost:

- weak aspects become very costly
- the graph becomes more rigid

With log-cost:

- weak aspects remain usable
- the graph stays more fluid and connected

---

# filter weight ≥

This is only a visual filter.

It does NOT change:

- calculations
- metrics
- topology

It only hides weak edges from the display.

---

# TECHNICAL EXPLANATION

# Weight Computation Model

Each detected aspect becomes a weighted edge.

Core logic:

```js
function computeWeight(orb, orbMax, curve, kExp = 3, thrPoint = 0.5) {
  if (orb > orbMax) return 0;

  const ratio = orb / orbMax;

  if (curve === 'linear')
    w = 1 - ratio;

  else if (curve === 'exponential')
    w = Math.exp(-kExp * ratio);

  else if (curve === 'threshold')
    w = ratio <= thrPoint ? 1.0 : 0.0;

  return Math.max(w, 1e-6);
}
```

---

# Linear Curve

Formula:

$$
w = 1 - ratio
$$

Uniform decay across the orb interval.

---

# Exponential Curve

Formula:

$$
w = e^{-kr}
$$

where:

- r = normalized orb
- k = k-exp

Rapid non-linear decay.

---

# Threshold Curve

Formula:

$$
w =
\begin{cases}
1 & ratio \le thrPoint \\
0 & ratio > thrPoint
\end{cases}
$$

Binary activation model.

---

# Weighted Cost Models

Weighted shortest paths transform edge weights into traversal costs.

## Reciprocal Cost

Formula:

$$
cost = 1/w
$$

Weak edges become very expensive.

---

## Logarithmic Cost

Activated by:

- log-cost

Formula:

$$
cost = -\log(w)
$$

This preserves alternative routes more effectively.

---

# Curve + Cost Interaction

| Combination | Behavior |
|---|---|
| Linear + `1/w` | moderately selective |
| Linear + log | permissive |
| Exponential + `1/w` | highly rigid |
| Exponential + log | selective but stable |
| Threshold + log | near-unweighted behavior |

---

# Visual Weight Filter

The filter hides low-weight edges visually.

Invisible edges still exist internally for calculations.

---

# PART V — GRAPH VISUALIZATION

# Nodes

Each node represents:

- a planet
- an angle
- a node
- another astrological point

Nodes can be dragged manually.

---

# Edges

Edges represent aspects.

Edge thickness reflects weight strength.

---

# Layout Simulation

The graph uses force-directed layout dynamics.

This means:

- connected nodes cluster together
- weakly connected nodes drift outward
- structural groups become visible

The layout represents topological space, not zodiacal space.

---

# PART VI — TRANSITS

# Transit Overlay System

LOB65 supports transit overlays.

The system can display:

- natal-to-transit aspects
- transit-to-transit aspects
- combined graphs

---

# Adding Transits

Use the Transit panel.

Typical workflow:

1. Enter natal chart
2. Add transits
3. Compute graph
4. Analyze structural changes

---

# Transit Sets

Transit configurations can be saved and reloaded.

Useful for:

- forecasting
- repeated analysis
- timeline comparison

---

# PART VII — SAVING AND LOADING

# Themes

A Theme stores:

- chart data
- orb settings
- weighting configuration

Themes can be:

- saved
- loaded
- exported as JSON
- imported from JSON

---

# PART VIII — ANALYTICAL METRICS

# Connectivity

Connectivity measures how well the graph holds together.

High connectivity:

- many alternative pathways
- strong integration

Low connectivity:

- fragmentation
- isolated sectors
- bottlenecks

---

# Centrality

Centrality measures which nodes dominate graph structure.

High-centrality nodes may function as:

- hubs
- bridges
- routing centers

---

# Betweenness Centrality

Betweenness measures how often a node lies on shortest paths.

High betweenness nodes act as:

- mediators
- bridges
- structural bottlenecks

---

# Weighted vs Unweighted Analysis

Unweighted analysis:

- treats all aspects equally

Weighted analysis:

- uses aspect strength
- incorporates orb precision
- changes pathway costs

These modes can produce very different graph structures.

---

# Connected Components

A connected component is an isolated graph region.

Multiple components indicate:

- disconnected sectors
- graph islands
- lack of structural communication

---

# PART IX — PRACTICAL WORKFLOWS

# Suggested Beginner Workflow

1. Use default orbs
2. Start with Linear mode
3. Keep `k-exp` at default values
4. Disable heavy filtering
5. Observe hubs and clusters
6. Compare weighted vs unweighted results

---

# Suggested Experimental Workflow

1. Compare Linear vs Exponential
2. Increase `k-exp`
3. Enable `log-cost`
4. Apply visual filtering
5. Compare topology changes
6. Study shortest-path concentration

---

# Interpretation Guidelines

LOB65 is a structural analysis environment.

The graph should not be interpreted as:

- deterministic prediction
- psychological truth
- replacement for astrology

Instead, it provides:

- structural organization
- topological patterns
- connectivity analysis
- weighted relationship analysis

---

# FINAL SUMMARY

LOB65 combines:

- astrological aspect structures
- weighted graphs
- dynamic visualization
- topological analysis
- transit overlays
- configurable weighting systems
- network metrics

The application allows the user to move from:

traditional aspect lists

to:

interactive structural graph analysis.

