import { makeRng, pick, randInt } from "./rng";

type RNG = ReturnType<typeof makeRng>;

// ── Music theory ──────────────────────────────────────────────────────────────

const CHORD_PROGRESSIONS: number[][] = [
  [0, 5, 3, 4],
  [0, 3, 4, 3],
  [5, 3, 0, 4],
  [0, 2, 3, 4],
  [0, 5, 1, 4],
  [3, 4, 0, 5],
  [0, 0, 3, 4],
];

const SCALES: Record<string, number[]> = {
  major:      [0, 2, 4, 5, 7, 9, 11],
  minor:      [0, 2, 3, 5, 7, 8, 10],
  dorian:     [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  pentatonic: [0, 2, 4, 7, 9],
};

const RHYTHM_PATTERNS: number[][] = [
  [1, 1, 1, 1],
  [0.5, 0.5, 1, 1, 1],
  [1, 0.5, 0.5, 1, 1],
  [2, 1, 1],
  [0.5, 0.5, 0.5, 0.5, 1, 1],
  [1.5, 0.5, 1, 1],
  [0.75, 0.25, 0.75, 0.25, 1, 1],
];

const MELODY_PROGRAMS = [0, 4, 5, 24, 25, 40, 56, 73, 80];
const CHORD_PROGRAMS  = [0, 4, 48, 52, 88, 89];
const BASS_PROGRAMS   = [32, 33, 34, 35, 38, 39];

// ── MIDI note helpers ─────────────────────────────────────────────────────────

function scaleNote(
    root: number,
    scale: number[],
    degree: number,
    octave: number
): number {
  const len = scale.length;
  const idx = ((degree % len) + len) % len;
  const octaveShift = Math.floor(degree / len);
  return root + scale[idx] + (octave + octaveShift) * 12;
}

function chordNotes(
    root: number,
    scale: number[],
    degree: number,
    octave: number
): number[] {
  return [0, 2, 4].map(d =>
      scaleNote(root, scale, degree + d, octave)
  );
}

// ── Pure MIDI binary builder (no external deps) ───────────────────────────────

function varLen(n: number): number[] {
  const bytes: number[] = [n & 0x7f];
  n >>>= 7;
  while (n > 0) {
    bytes.unshift((n & 0x7f) | 0x80);
    n >>>= 7;
  }
  return bytes;
}

function uint32(n: number): number[] {
  return [
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8)  & 0xff,
    n         & 0xff,
  ];
}

function uint16(n: number): number[] {
  return [(n >>> 8) & 0xff, n & 0xff];
}

interface MidiEvent {
  delta: number;
  data:  number[];
}

function buildTrack(events: MidiEvent[]): number[] {
  const body: number[] = [];
  for (const ev of events) {
    body.push(...varLen(ev.delta), ...ev.data);
  }
  // End of track meta event
  body.push(0x00, 0xff, 0x2f, 0x00);
  return [
    0x4d, 0x54, 0x72, 0x6b, // "MTrk"
    ...uint32(body.length),
    ...body,
  ];
}

function evNoteOn(ch: number, note: number, vel: number): number[] {
  return [0x90 | (ch & 0xf), note & 0x7f, vel & 0x7f];
}

function evNoteOff(ch: number, note: number): number[] {
  return [0x80 | (ch & 0xf), note & 0x7f, 0x00];
}

function evProgram(ch: number, prog: number): number[] {
  return [0xc0 | (ch & 0xf), prog & 0x7f];
}

function evTempo(bpm: number): number[] {
  const us = Math.round(60_000_000 / bpm);
  return [
    0xff, 0x51, 0x03,
    (us >>> 16) & 0xff,
    (us >>> 8)  & 0xff,
    us         & 0xff,
  ];
}

// ── Main generator ────────────────────────────────────────────────────────────

export async function generateMidiBuffer(seed: string): Promise<Buffer> {
  const rng = makeRng(seed);

  const TICKS = 480;
  const bpm   = randInt(72, 155, rng);
  const root  = randInt(48, 60, rng);

  const scaleName = pick(SCALE_NAMES, rng);
  const scale     = SCALES[scaleName];
  const prog      = pick(CHORD_PROGRESSIONS, rng);
  const rhythm    = pick(RHYTHM_PATTERNS, rng);
  const bars      = 16;

  const melodyProg = pick(MELODY_PROGRAMS, rng);
  const chordProg  = pick(CHORD_PROGRAMS,  rng);
  const bassProg   = pick(BASS_PROGRAMS,   rng);

  // ── Track 0: tempo ──────────────────────────────────────────────────────────
  const tempoTrack: MidiEvent[] = [
    { delta: 0, data: evTempo(bpm) },
  ];

  // ── Track 1: melody ─────────────────────────────────────────────────────────
  const melodyEvents: MidiEvent[] = [
    { delta: 0, data: evProgram(0, melodyProg) },
  ];

  let pendingDelta = 0;
  for (let bar = 0; bar < bars; bar++) {
    const chordDeg = prog[bar % prog.length];
    let beat = 0;
    let ri   = 0;

    while (beat < 4) {
      const dur = rhythm[ri % rhythm.length];
      ri++;

      // 70% chance pick a chord tone, 30% passing tone
      const chordDegs   = [0, 2, 4].map(d => (chordDeg + d) % scale.length);
      const passingDegs = [1, 3, 5, 6].map(d =>
          ((chordDeg + d) % scale.length + scale.length) % scale.length
      );
      const pool  = rng() < 0.7 ? chordDegs : passingDegs;
      const deg   = pick(pool, rng);
      const note  = Math.min(127, Math.max(0, scaleNote(root, scale, deg, 5)));
      const vel   = randInt(60, 100, rng);
      const onTicks  = Math.round(dur * TICKS * 0.88);
      const offTicks = Math.round(dur * TICKS * 0.12);

      melodyEvents.push({ delta: pendingDelta, data: evNoteOn(0, note, vel) });
      pendingDelta = 0;
      melodyEvents.push({ delta: onTicks, data: evNoteOff(0, note) });
      pendingDelta = offTicks;

      beat += dur;
      if (beat >= 4) break;
    }
  }

  // ── Track 2: chords ─────────────────────────────────────────────────────────
  const chordEvents: MidiEvent[] = [
    { delta: 0, data: evProgram(1, chordProg) },
  ];

  let chordDelta = 0;
  for (let bar = 0; bar < bars; bar++) {
    const chordDeg = prog[bar % prog.length];
    const notes    = chordNotes(root, scale, chordDeg, 4).map(n =>
        Math.min(127, Math.max(0, n))
    );
    const vel      = randInt(40, 70, rng);
    const barTicks = 4 * TICKS;
    const onTicks  = Math.round(barTicks * 0.9);
    const gapTicks = barTicks - onTicks;

    // All notes on
    chordEvents.push({ delta: chordDelta, data: evNoteOn(1, notes[0], vel) });
    chordDelta = 0;
    for (let n = 1; n < notes.length; n++) {
      chordEvents.push({ delta: 0, data: evNoteOn(1, notes[n], vel) });
    }
    // All notes off
    chordEvents.push({ delta: onTicks, data: evNoteOff(1, notes[0]) });
    for (let n = 1; n < notes.length; n++) {
      chordEvents.push({ delta: 0, data: evNoteOff(1, notes[n]) });
    }
    chordDelta = gapTicks;
  }

  // ── Track 3: bass ────────────────────────────────────────────────────────────
  const bassEvents: MidiEvent[] = [
    { delta: 0, data: evProgram(2, bassProg) },
  ];

  let bassDelta = 0;
  for (let bar = 0; bar < bars; bar++) {
    const chordDeg = prog[bar % prog.length];
    const rootNote = Math.min(127, Math.max(0, scaleNote(root, scale, chordDeg, 3)));
    const fifth    = Math.min(127, Math.max(0, scaleNote(root, scale, chordDeg + 4, 3)));

    const pattern = [
      { note: rootNote, startBeat: 0, dur: 2 },
      { note: fifth,    startBeat: 2, dur: 2 },
    ];

    for (const beat of pattern) {
      const vel      = randInt(55, 80, rng);
      const durTicks = beat.dur * TICKS;
      const onTicks  = Math.round(durTicks * 0.85);
      const gapTicks = durTicks - onTicks;

      bassEvents.push({ delta: bassDelta, data: evNoteOn(2, beat.note, vel) });
      bassDelta = 0;
      bassEvents.push({ delta: onTicks, data: evNoteOff(2, beat.note) });
      bassDelta = gapTicks;
    }
  }

  // ── Drum track (channel 9) ───────────────────────────────────────────────────
  const drumEvents: MidiEvent[] = [];
  const KICK  = 36;
  const SNARE = 38;
  const HIHAT = 42;

  let drumDelta = 0;
  for (let bar = 0; bar < bars; bar++) {
    // Basic 4/4 drum pattern per bar
    const beatPattern = [
      { note: KICK,  tick: 0           },
      { note: HIHAT, tick: TICKS / 2   },
      { note: SNARE, tick: TICKS       },
      { note: HIHAT, tick: TICKS * 1.5 },
      { note: KICK,  tick: TICKS * 2   },
      { note: HIHAT, tick: TICKS * 2.5 },
      { note: SNARE, tick: TICKS * 3   },
      { note: HIHAT, tick: TICKS * 3.5 },
    ];

    let lastTick = 0;
    for (const hit of beatPattern) {
      const delta = Math.round(hit.tick) - lastTick;
      const vel   = randInt(70, 110, rng);
      drumEvents.push({ delta: drumDelta + delta, data: evNoteOn(9, hit.note, vel) });
      drumDelta = 0;
      drumEvents.push({ delta: 30, data: evNoteOff(9, hit.note) });
      lastTick = Math.round(hit.tick);
    }
    drumDelta = 4 * TICKS - Math.round(beatPattern[beatPattern.length - 1].tick) - 30;
  }

  // ── Assemble MIDI file ───────────────────────────────────────────────────────
  const header = [
    0x4d, 0x54, 0x68, 0x64, // "MThd"
    ...uint32(6),            // header length always 6
    ...uint16(1),            // format 1 = multi-track
    ...uint16(5),            // 5 tracks
    ...uint16(TICKS),        // ticks per quarter note
  ];

  const allTracks = [
    buildTrack(tempoTrack),
    buildTrack(melodyEvents),
    buildTrack(chordEvents),
    buildTrack(bassEvents),
    buildTrack(drumEvents),
  ];

  return Buffer.from([...header, ...allTracks.flat()]);
}


