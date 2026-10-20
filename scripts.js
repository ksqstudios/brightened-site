// Brightened. Two small things, neither of which stores or sends anything.
//
// 1. The week in the hero: the seven days rise one at a time, the average
//    climbs, and the panel moves through the stages as it passes each
//    quarter of the goal, the same rule the app uses. Afterwards any day
//    can be dragged, or nudged with the arrow keys.
// 2. The day's arc: a sun crosses from 5 AM to 9 PM and lights the
//    stretches spent outside, adding up today's minutes.

(function () {
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  var STAGES = [
    { id: 'slate',   name: 'Slate',   dark: true },
    { id: 'dusk',    name: 'Dusk',    dark: true },
    { id: 'dawn',    name: 'Dawn',    dark: false },
    { id: 'amber',   name: 'Amber',   dark: false },
    { id: 'radiant', name: 'Radiant', dark: false }
  ];

  // The app's rule: the average as a share of the goal, in quarters.
  function stageFor(avg, goal) {
    var r = goal > 0 ? avg / goal : 0;
    return r < 0.25 ? STAGES[0] : r < 0.5 ? STAGES[1] : r < 0.75 ? STAGES[2] : r < 1 ? STAGES[3] : STAGES[4];
  }

  // ---------- 1. The week ----------

  var week = document.getElementById('week');
  if (week) {
    var GOAL = 60, MAX = 200;
    var days = Array.prototype.slice.call(week.querySelectorAll('.day'));
    var names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var values = days.map(function (d) { return +d.dataset.min; });
    var shown = days.map(function () { return 0; });
    var avgEl = document.getElementById('avg');
    var totalEl = document.getElementById('total');
    var nameEl = document.getElementById('stage-name');
    var scale = document.querySelectorAll('#scale li');
    var current = null;

    function paint() {
      var total = shown.reduce(function (a, b) { return a + b; }, 0);
      var avg = Math.round(total / 7);
      avgEl.textContent = avg;
      totalEl.textContent = total;
      var s = stageFor(avg, GOAL);
      days.forEach(function (d, i) {
        d.querySelector('.fill').style.height = (Math.min(shown[i], MAX) / MAX * 100) + '%';
        d.classList.toggle('is-light', shown[i] < GOAL / 2);
        d.setAttribute('aria-label', names[i] + ', ' + shown[i] + ' minutes of daylight');
      });
      if (s !== current) {
        current = s;
        nameEl.textContent = s.name;
        root.style.setProperty('--stage-1', 'var(--' + s.id + '-1)');
        root.style.setProperty('--stage-2', 'var(--' + s.id + '-2)');
        root.style.setProperty('--stage-m', 'var(--' + s.id + '-m)');
        root.style.setProperty('--on-stage', s.dark ? '#fff' : 'rgba(0, 0, 0, 0.85)');
        scale.forEach(function (li) { li.classList.toggle('is-on', li.dataset.stage === s.id); });
      }
    }

    // The rise.
    if (still) {
      shown = values.slice();
      paint();
    } else {
      paint();
      var rise = function () {
        days.forEach(function (d, i) {
          setTimeout(function () { if (!shown[i]) { shown[i] = values[i]; paint(); } }, 400 + i * 420);
        });
      };
      // Start when the week is on screen, which on a phone is after a scroll.
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries, obs) {
          if (entries[0].isIntersecting) { obs.disconnect(); rise(); }
        }, { threshold: 0.6 }).observe(week.querySelector('.days-card'));
      } else {
        rise();
      }
    }

    // Dragging a day.
    function setFrom(d, i, y) {
      var r = d.getBoundingClientRect();
      var trackBottom = r.bottom - parseFloat(getComputedStyle(d).paddingBottom);
      var h = trackBottom - r.top;
      var m = Math.round(Math.max(0, Math.min(1, (trackBottom - y) / h)) * MAX / 5) * 5;
      shown[i] = m;
      paint();
    }

    days.forEach(function (d, i) {
      d.addEventListener('pointerdown', function (e) {
        d.setPointerCapture(e.pointerId);
        d.classList.add('is-dragging');
        setFrom(d, i, e.clientY);
      });
      d.addEventListener('pointermove', function (e) {
        if (d.classList.contains('is-dragging')) setFrom(d, i, e.clientY);
      });
      ['pointerup', 'pointercancel'].forEach(function (t) {
        d.addEventListener(t, function () { d.classList.remove('is-dragging'); });
      });
      d.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          shown[i] = Math.max(0, Math.min(MAX, shown[i] + (e.key === 'ArrowUp' ? 5 : -5)));
          paint();
        }
      });
    });
  }

  // ---------- 2. The day's arc ----------

  var arc = document.getElementById('arc');
  if (arc) {
    var START = 300, END = 1260, SPAN = END - START;   // 5 AM to 9 PM
    var segs = Array.prototype.slice.call(arc.querySelectorAll('.seg'));
    var sun = document.getElementById('sun');
    var minEl = document.getElementById('arc-min');

    segs.forEach(function (s) {
      var a = +s.dataset.from, b = +s.dataset.to;
      s.style.left = ((a - START) / SPAN * 100) + '%';
      s.style.width = ((b - a) / SPAN * 100) + '%';
    });

    function at(t) {
      var mins = 0;
      segs.forEach(function (s) {
        var a = +s.dataset.from, b = +s.dataset.to;
        var k = Math.max(0, Math.min(1, (t - a) / (b - a)));
        s.style.transform = 'scaleX(' + k + ')';
        mins += (b - a) * k;
      });
      sun.style.left = ((t - START) / SPAN * 100) + '%';
      minEl.textContent = Math.round(mins);
    }

    segs.forEach(function (s) { s.style.transition = 'none'; });

    if (still || !('IntersectionObserver' in window)) {
      at(END);
    } else {
      at(START);
      new IntersectionObserver(function (entries, obs) {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        arc.classList.add('is-running');
        var t0 = null, DUR = 5200;
        requestAnimationFrame(function step(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min(1, (ts - t0) / DUR);
          var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          at(START + SPAN * e);
          if (p < 1) requestAnimationFrame(step);
          else setTimeout(function () { arc.classList.remove('is-running'); }, 600);
        });
      }, { threshold: 0.5 }).observe(arc.querySelector('.arc-card'));
    }
  }
})();
