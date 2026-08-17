/* ============================================================
   AI PERSONA TOOL (prototype)
   A live, in-page rework of the HEXACO-to-color methodology this
   case study documents: six trait sliders drive a fused color per
   trait (linear RGB interpolation between two brand-ish endpoint
   hexes, same idea as "the fused color for each trait was picked
   from a palette generator"), a generated personality/voice-and-tone
   read, and a one-click download of the whole thing as a Claude
   skill markdown file — frontmatter + persona guide, ready to drop
   into a skills folder.

   Exposed as window.PersonaTool.init(scope) so the split-panel view
   on the homepage (which injects this page's <main> via innerHTML,
   bypassing this file's own <script> tag on that page) can re-run
   it against the freshly-injected DOM — see js/case-panel.js.
   ============================================================ */

(function () {
  'use strict';

  var TRAITS = [
    {
      id: 'H',
      name: 'Honesty-Humility',
      lowLabel: 'Confident & Self-Promotional',
      highLabel: 'Sincere & Modest',
      lowColor: '#c9922e',
      highColor: '#2e6f95',
      lowDesc: 'confident and self-assured, comfortable stating its own value',
      highDesc: 'sincere and modest, quick to credit its sources and acknowledge its limits',
      lowVoice: "States its own capabilities plainly and isn't shy about recommending itself.",
      highVoice: 'Leads with transparency — flags uncertainty and gives credit where it’s due.'
    },
    {
      id: 'E',
      name: 'Emotionality',
      lowLabel: 'Brave & Self-Assured',
      highLabel: 'Sentimental & Empathic',
      lowColor: '#2e7d6b',
      highColor: '#c4577b',
      lowDesc: "even-keeled and self-assured, doesn't dwell on setbacks",
      highDesc: 'warm and sentimental, attentive to how a moment feels and not just what it means',
      lowVoice: 'Stays composed under pressure and moves the conversation forward without lingering on what went wrong.',
      highVoice: 'Names the emotional stakes out loud and checks in before jumping to the next step.'
    },
    {
      id: 'X',
      name: 'eXtraversion',
      lowLabel: 'Reserved & Measured',
      highLabel: 'Outgoing & Lively',
      lowColor: '#6b5b95',
      highColor: '#e0a937',
      lowDesc: 'measured and reserved, gets to the point without much preamble',
      highDesc: 'outgoing and lively, conversational and quick to add a little energy',
      lowVoice: 'Keeps responses concise and lets the content carry the conversation.',
      highVoice: 'Uses a conversational tone, contractions, and the occasional bit of enthusiasm.'
    },
    {
      id: 'A',
      name: 'Agreeableness',
      lowLabel: 'Direct & Unfiltered',
      highLabel: 'Tolerant & Gentle',
      lowColor: '#b23a48',
      highColor: '#4fa36b',
      lowDesc: 'direct and unfiltered, willing to disagree plainly when it matters',
      highDesc: 'patient and gentle, framing pushback carefully and assuming good intent',
      lowVoice: 'Disagrees plainly when the facts call for it, without over-softening the message.',
      highVoice: 'Leads with patience — reframes disagreement gently and avoids putting anyone on the defensive.'
    },
    {
      id: 'C',
      name: 'Conscientiousness',
      lowLabel: 'Casual & Spontaneous',
      highLabel: 'Disciplined & Precise',
      lowColor: '#8c7a6b',
      highColor: '#35507a',
      lowDesc: 'casual and spontaneous, comfortable improvising through ambiguity',
      highDesc: 'disciplined and precise, methodical about details and cautious about overpromising',
      lowVoice: "Improvises comfortably and doesn't over-plan a response before giving it.",
      highVoice: 'Double-checks details, structures its answers, and is careful never to overpromise.'
    },
    {
      id: 'O',
      name: 'Openness',
      lowLabel: 'Conventional & Practical',
      highLabel: 'Curious & Inventive',
      lowColor: '#6e7b8b',
      highColor: '#d65d8a',
      lowDesc: 'practical and conventional, favors proven answers over novel ones',
      highDesc: 'curious and inventive, reaches for metaphor and offers creative alternatives',
      lowVoice: 'Reaches for the proven, well-tested answer first.',
      highVoice: 'Offers an unexpected angle or a metaphor when it makes an idea click.'
    }
  ];

  function hexToRgb(hex) {
    var n = parseInt(hex.replace('#', ''), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (v) {
      return Math.round(v).toString(16).padStart(2, '0');
    }).join('');
  }
  function lerpColor(hexA, hexB, t) {
    var a = hexToRgb(hexA), b = hexToRgb(hexB);
    return rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
  }
  function tint(hex, amount) {
    var c = hexToRgb(hex);
    return rgbToHex(c.r + (255 - c.r) * amount, c.g + (255 - c.g) * amount, c.b + (255 - c.b) * amount);
  }
  function poleDesc(trait, v) {
    if (v < 35) return trait.lowDesc;
    if (v > 65) return trait.highDesc;
    return trait.lowDesc + ', tempered by being ' + trait.highDesc;
  }
  function poleVoice(trait, v) {
    if (v < 35) return trait.lowVoice;
    if (v > 65) return trait.highVoice;
    return trait.lowVoice + ' At the same time, ' + trait.highVoice.charAt(0).toLowerCase() + trait.highVoice.slice(1);
  }
  function slugify(str) {
    return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'my-assistant';
  }

  function initPersonaTool(scope) {
    scope = scope || document;
    var root = scope.querySelector ? scope.querySelector('#personaTool') : null;
    if (!root) return;

    var nameInput = root.querySelector('#personaName');
    var swatchesEl = root.querySelector('#personaSwatches');
    var summaryEl = root.querySelector('#personaSummary');
    var voiceEl = root.querySelector('#personaVoice');
    var downloadBtn = root.querySelector('#personaDownload');
    var controlsEl = root.querySelector('#personaControls');
    if (!nameInput || !swatchesEl || !summaryEl || !voiceEl || !downloadBtn || !controlsEl) return;

    // Re-inits (panel navigation) inject fresh markup each time, but guard
    // against double-building controls if init ever runs twice on the same DOM.
    controlsEl.innerHTML = '';
    TRAITS.forEach(function (trait) {
      var wrap = document.createElement('div');
      wrap.className = 'persona-trait';
      wrap.innerHTML =
        '<div class="persona-trait-title">' + trait.name + '</div>' +
        '<input type="range" min="0" max="100" value="50" class="persona-slider" data-trait="' + trait.id + '" aria-label="' + trait.name + '" />' +
        '<div class="persona-trait-labels"><span>' + trait.lowLabel + '</span><span>' + trait.highLabel + '</span></div>';
      controlsEl.appendChild(wrap);
    });

    function getState() {
      var values = {};
      TRAITS.forEach(function (trait) {
        var el = controlsEl.querySelector('input[data-trait="' + trait.id + '"]');
        values[trait.id] = parseInt(el.value, 10);
      });
      return { name: (nameInput.value || 'My Assistant').trim(), values: values };
    }

    function computePalette(values) {
      var fused = TRAITS.map(function (trait) {
        return { trait: trait, hex: lerpColor(trait.lowColor, trait.highColor, values[trait.id] / 100) };
      });
      var ranked = fused.slice().sort(function (a, b) {
        return Math.abs(values[b.trait.id] - 50) - Math.abs(values[a.trait.id] - 50);
      });
      var signature = ranked[0];
      var secondary = ranked[1];
      var neutral = tint(signature.hex, 0.85);
      return { fused: fused, signature: signature, secondary: secondary, neutral: neutral };
    }

    function render() {
      var state = getState();
      var palette = computePalette(state.values);

      swatchesEl.innerHTML = '';
      [
        { label: 'Signature', hex: palette.signature.hex },
        { label: 'Secondary', hex: palette.secondary.hex },
        { label: 'Neutral', hex: palette.neutral }
      ].forEach(function (s) {
        var el = document.createElement('div');
        el.className = 'persona-swatch';
        el.style.background = s.hex;
        el.style.color = s.label === 'Neutral' ? 'var(--text-primary)' : '#fff';
        el.innerHTML = '<span>' + s.label + '</span><strong>' + s.hex.toUpperCase() + '</strong>';
        swatchesEl.appendChild(el);
      });

      var descriptors = TRAITS.map(function (trait) { return poleDesc(trait, state.values[trait.id]); });
      summaryEl.textContent = state.name + ' is ' + descriptors.slice(0, -1).join(', ') + ', and ' + descriptors[descriptors.length - 1] + '.';

      voiceEl.innerHTML = '';
      TRAITS.forEach(function (trait) {
        var li = document.createElement('li');
        li.textContent = poleVoice(trait, state.values[trait.id]);
        voiceEl.appendChild(li);
      });
    }

    function generateMarkdown() {
      var state = getState();
      var values = state.values;
      var palette = computePalette(values);
      var slug = slugify(state.name) + '-persona';
      var descriptors = TRAITS.map(function (trait) { return poleDesc(trait, values[trait.id]); });
      var summary = state.name + ' is ' + descriptors.slice(0, -1).join(', ') + ', and ' + descriptors[descriptors.length - 1] + '.';

      var lines = [];
      lines.push('---');
      lines.push('name: ' + slug);
      lines.push('description: Voice, tone, and brand guidance for ' + state.name + ', a persona generated with the AI Persona Toolkit. Use this skill whenever writing copy, prompts, or responses in ' + state.name + '’s voice, or picking colors for ' + state.name + '’s UI.');
      lines.push('---');
      lines.push('');
      lines.push('# ' + state.name + ' — Persona Guide');
      lines.push('');
      lines.push('_Generated with the AI Persona Toolkit — a HEXACO-based personality, voice, and color framework._');
      lines.push('');
      lines.push('## Personality (HEXACO)');
      lines.push('');
      TRAITS.forEach(function (trait) {
        lines.push('- **' + trait.name + ' (' + values[trait.id] + '%)** — ' + poleDesc(trait, values[trait.id]));
      });
      lines.push('');
      lines.push(summary);
      lines.push('');
      lines.push('## Voice & Tone');
      lines.push('');
      TRAITS.forEach(function (trait) {
        lines.push('- ' + poleVoice(trait, values[trait.id]));
      });
      lines.push('');
      lines.push('## Brand Colors');
      lines.push('');
      lines.push('| Role | Hex | Trait |');
      lines.push('|---|---|---|');
      lines.push('| Signature | `' + palette.signature.hex.toUpperCase() + '` | ' + palette.signature.trait.name + ' |');
      lines.push('| Secondary | `' + palette.secondary.hex.toUpperCase() + '` | ' + palette.secondary.trait.name + ' |');
      lines.push('| Neutral / surface | `' + palette.neutral.toUpperCase() + '` | tint of signature |');
      palette.fused.forEach(function (f) {
        lines.push('| ' + f.trait.name + ' | `' + f.hex.toUpperCase() + '` | ' + values[f.trait.id] + '% toward ' + f.trait.highLabel + ' |');
      });
      lines.push('');
      lines.push('## How to Use This Skill');
      lines.push('');
      lines.push('When responding as ' + state.name + ', adopt the personality and voice above. Default to the signature and secondary colors for any UI, diagrams, or generated visuals, and use the neutral tone as a background or surface color.');
      lines.push('');

      return { slug: slug, content: lines.join('\n') };
    }

    function download() {
      var md = generateMarkdown();
      var blob = new Blob([md.content], { type: 'text/markdown' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = md.slug + '.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    controlsEl.addEventListener('input', render);
    nameInput.addEventListener('input', render);
    downloadBtn.addEventListener('click', download);

    render();
  }

  window.PersonaTool = { init: initPersonaTool };

  // Direct page load (project-persona.html itself): this script sits at the
  // bottom of <body>, so #personaTool is already in the DOM — init right away.
  // On the homepage, #personaTool won't exist yet at this point (it only
  // shows up once the split panel injects this page's content), so this is
  // a no-op there and js/case-panel.js calls PersonaTool.init(body) instead.
  if (document.getElementById('personaTool')) initPersonaTool(document);
})();
