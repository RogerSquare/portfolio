---
title: Designing a PCB Trace Background Animation
date: 2026-04-10
tags: [design, canvas, animation, portfolio]
description: How I built a generative PCB trace background for my portfolio, inspired by antfu.me's approach to subtle web animation.
project: portfolio
---

When I set out to redesign my portfolio at [r-that.com](https://r-that.com), I knew the background needed to be more than a solid color. But I also didn't want something distracting. The best backgrounds are the ones you barely notice until you look for them.

## Starting Point: antfu.me

Anthony Fu's personal site has one of the most elegant background animations I've seen. It's a generative fractal tree called "Plum" that grows from the edges of the screen -- delicate branches that split and spread in organic patterns. What makes it work isn't the animation itself, but how invisible it is. The branches are drawn at 14% opacity in neutral gray. Most visitors never consciously notice it.

I studied his implementation in detail. It comes from his [100-day creative coding challenge](https://100.antfu.me/013), and the core algorithm is surprisingly simple: start from the edges, grow a line segment in a direction, split into two children at random angles, repeat. The magic is in the parameters.

## What Makes It Feel Premium

After studying the code, I identified the techniques that separate a "premium" background from an amateur one:

**DPI-aware rendering.** The canvas scales to `devicePixelRatio`, so lines are crisp on retina displays instead of blurry.

**Radial vignette mask.** A CSS `mask-image: radial-gradient()` makes the animation invisible in the center (where your content is) and visible at the edges. This single technique prevents the animation from ever competing with text.

**Staggered growth.** Each frame, 65% of pending branches are deferred to the next frame. This creates organic, uneven growth instead of everything expanding uniformly. The animation feels alive rather than mechanical.

**Frame rate cap at 20fps.** Not 60fps, not even 30. The slower rate makes the growth feel deliberate and calm. Background animations should never feel urgent.

**Grows and stops.** The animation completes and stays as a static pattern. No looping, no reset. It draws once and becomes part of the page.

## Making It My Own: PCB Traces

I didn't want to copy antfu's organic tree directly. Given my background in systems engineering and infrastructure, I wanted something that reflected the technical side of my work. PCB traces -- the copper pathways on a circuit board -- felt right.

Real PCB traces follow specific routing rules that make them visually distinct from organic branching:

```javascript
// PCB traces only move in 8 directions: 0°, 45°, 90°, etc.
const ANGLES = [0, PI/4, PI/2, 3*PI/4, PI, 5*PI/4, 3*PI/2, 7*PI/4];

function pickTurn(rad) {
  var r = random();
  if (r < 0.6) return rad;        // 60% go straight
  if (r < 0.9) return snap45(rad); // 30% turn 45 degrees
  return snap90(rad);               // 10% turn 90 degrees
}
```

This constraint -- only allowing movement in 45-degree increments -- is what makes traces look like traces instead of random lines. The 60/30/10 distribution means most segments run straight with occasional turns, just like real PCB routing.

## The Details

**Vias and pads.** At 12% of junctions, I draw a small circle representing a via (a drill hole that connects layers on a real PCB). At 4% of points, a slightly larger filled circle represents a solder pad. These tiny details are what sell the effect.

**T-junctions.** Real PCBs branch with perpendicular splits, not random angles. When a trace splits, the child goes at exactly 90 degrees from the parent direction. This happens at 20% of early junctions and 8% later on.

**Square line caps.** `ctx.lineCap = 'square'` gives traces their characteristic flat ends instead of rounded ones.

**Longer segments.** PCB traces run 8-20 pixels per segment, much longer than the 6-pixel organic branches. Circuit boards are precise, not chaotic.

## The Numbers

The final implementation:

| Parameter | Value | Why |
|-----------|-------|-----|
| Frame rate | 20 fps | Deliberate, calm growth |
| Line opacity | ~9% (`#88888818`) | Barely visible |
| Guaranteed iterations | 45 | Dense enough to fill the screen |
| Branch rate (early) | 85% | Reliable initial spread |
| Branch rate (late) | 50% | Natural taper-off |
| Frame deferral | 65% | Organic timing |
| Start points | 10 (4 mobile) | Coverage from all edges |
| Vignette mask | 20% transparent center | Content always readable |

## What I Learned

The biggest lesson: restraint is the hardest part. My first three attempts were all too visible, too fast, or too clever. The version that works is the one where you have to actively look for the animation to see it. The best design details are the ones that make people feel something without knowing why.

If you want to see it in action, visit [r-that.com](https://r-that.com) and look at the edges of the screen. Or don't -- that's kind of the point.
