Pomodoro Timer SPA — Project Concept
1. Core idea

This is a single-page Pomodoro timer application designed around a playful tomato-themed visual style.
The main focus of the interface is a central tomato timer, with a curved progress slider wrapped around it. The timer supports:

setting the time manually with a numeric display,
controlling the time through a curved slider,
showing the remaining time in minutes and seconds,
visually representing progress as time passes,
switching between work and break periods.

The overall feel should be friendly, soft, and visually memorable, while still being practical and easy to use.

2. Visual style

The design should be inspired by the attached image:

warm beige or cream background,
hand-drawn, playful typography,
red tomato as the main visual element,
green accents for labels and decorative elements,
soft shadows and rounded shapes,
minimal but charming illustrations,
a cozy “poster-like” layout.

The page should feel more like an illustrated productivity tool than a strict dashboard.

3. Main layout

The page can be divided into these main areas:

Top section

A title such as:

POMODORO TECHNIQUE

Below the title, a short subtitle or helper text can explain the mode, for example:

Focus on work, then take a short break.

Center section

This is the main interactive area:

a large tomato in the middle,
a curved slider around the tomato,
a timer text above the tomato,
a small mode indicator such as Work / Short Break / Long Break.
Side or bottom section

Additional controls can be placed around the main tomato or below it:

Start / Pause button
Reset button
Mode switch buttons
Time presets
Optional sound toggle
Optional loop toggle
4. Main timer behavior

The timer should work in a very clear way:

Work session
Default work session: 25 minutes
The timer counts down from the selected value to zero
During this time, the tomato slider fills or moves along its curved path
Short break
Default short break: 5 minutes
After the work session ends, the app can automatically switch to a short break
Long break
Optional long break: 15–30 minutes
Can be activated after several completed work sessions
5. Numeric timer above the tomato

Above the tomato, there should be a large digital timer showing the exact remaining time.

Example format:

24:59

This timer should:

update every second,
always reflect the current selected duration,
be editable by the user,
allow time adjustment without using the slider.
Editable time input

The user should be able to set the time directly through the numeric display.
There are several possible ways to do this:

clicking the time and typing a value,
using plus/minus controls,
using a custom input field,
using the slider to update the same value.

The key requirement is that both controls stay synchronized.

6. Curved tomato slider

This is the most important visual element.

What it should do

The slider should act as a circular or arc-based progress control around the tomato.
It should:

be curved,
follow a custom angle defined in code,
stay visually limited to the tomato shape,
show the progression of the timer,
be draggable or adjustable by the user,
update the numeric timer when moved.
Main behavior

The slider should represent the current time value from 0 to 60 minutes.

A good interpretation is:

0 = no time selected,
25 = standard Pomodoro work session,
60 = maximum supported time.

As time passes, the slider should smoothly move along its arc, visually matching the amount of time elapsed.

Visual logic

You can define the slider path with:

SVG arc
or a custom circular progress ring
or a rotated track clipped around the tomato

For the best result, an SVG-based curved progress track is the cleanest choice.

7. Slider angle and shape

You mentioned that the slider should be curved at a specific angle and controlled in code.
That is a very good idea.

The curve can be defined with:

a start angle,
an end angle,
a radius,
a center point placed behind the tomato.

This gives you full control over:

how wide the arc is,
how much of the tomato it wraps around,
where the progress begins,
where it ends.
Example concept
start at the lower-left side of the tomato,
curve upward,
pass around the top,
end on the lower-right side.

This would look visually similar to the illustrated tomato ring from your reference image.

8. Time scale and 5-minute marks

The slider should have visible graduations every 5 minutes.

That means:

0, 5, 10, 15, 20, 25, 30, and so on,
small marks along the arc,
stronger marks at key values like 25 and 50,
labels may be optional, depending on space.

This makes the control easier to understand at a glance.

9. Synchronization between slider and timer

The slider and the numeric timer must always stay in sync.

When the user changes the timer with the slider:
the digital time updates immediately,
the tomato progress changes,
the internal countdown value changes.
When the user changes the numeric timer:
the slider position updates immediately,
the tomato progress adjusts,
the countdown duration changes.

This creates one shared state for both controls.

10. Timer states

The app should have a few clear states:

Idle
timer is set but not running
slider shows selected duration
start button is visible
Running
countdown is active
slider moves automatically
pause button is available
Paused
timer stops temporarily
current value is preserved
user can continue or reset
Completed
time reaches zero
sound or visual alert can play
app may switch to the next mode automatically
11. Controls

The app should include simple controls:

Start / Pause

Starts or pauses the countdown.

Reset

Returns the timer to the default selected value.

Work / Break selector

Lets the user choose between:

Work
Short Break
Long Break
Optional settings
sound on/off
auto-start next session
dark mode / light mode
custom duration presets
12. Suggested interaction flow

A clean user flow would be:

User opens the page.
The app shows 25:00 by default.
The user adjusts the time by dragging the tomato slider or editing the number.
The user presses Start.
The timer begins counting down.
The curved slider animates with the passage of time.
When it reaches zero, the app triggers completion feedback.
The user can start a break session or reset.
13. Design details inspired by the image

To keep it close to the reference, you can include:

a big central tomato illustration,
small decorative tomatoes around it,
curved arrows suggesting the cycle,
soft shadow under the tomato,
hand-drawn labels like:
Short Break 5 Minutes
Long Break 15–30 Minutes
a playful flag or small “start here” marker,
warm color palette with red, cream, green, and light gray.

The entire page should feel like a friendly productivity poster.

14. Accessibility ideas

Even though the design is decorative, it should still be usable:

clear contrast for timer text,
keyboard support for slider and buttons,
aria labels for controls,
readable timer font,
mobile-friendly layout,
large click targets.
15. Technical approach in plain JavaScript

This project can be built with:

semantic HTML
CSS
vanilla JavaScript
HTML structure

Use:

main
section
button
output
label
input
CSS

Use CSS for:

layout,
tomato illustration,
responsive design,
shadows,
animation,
curved track styling.
JavaScript

Use JS for:

timer logic,
slider interaction,
mode switching,
rendering time,
updating progress,
handling start/pause/reset,
storing settings in localStorage.
16. How the curved slider can work technically

The cleanest implementation is:

Option A: SVG arc
draw a path around the tomato,
place a progress stroke on top,
move a handle along the path.
Option B: Rotated circular ring
use a circular progress ring,
visually mask it so it fits around the tomato.
Option C: Custom path with percentage calculation
create a path,
calculate a point on the curve from 0–100%,
move a knob along the path.

For your design, SVG arc + draggable handle is the best option.

17. Recommended feature set for the first version

For a beginner-friendly version, the first release should include:

one work timer preset: 25 minutes,
one break preset: 5 minutes,
a numeric countdown,
a curved slider,
start / pause / reset,
progress animation,
simple sound alert when finished.

Then later you can add:

long break,
custom presets,
auto-cycle,
statistics,
session history.
18. Final project description

This project is a Pomodoro Timer SPA with a tomato-themed interface.
The main visual element is a large tomato in the center of the screen. Around it, a curved slider acts as the timer progress indicator and time selector. Above the tomato, a large digital countdown shows the exact remaining time in minutes and seconds. The user can change the time either by dragging the curved slider or by editing the numeric timer directly. The slider should move smoothly according to elapsed time, include 5-minute marks, and be limited to the size and shape of the tomato area. The interface should be warm, playful, and inspired by a hand-drawn infographic style.
