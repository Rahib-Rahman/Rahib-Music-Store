import seedrandom from "seedrandom";

type RNG = ReturnType<typeof seedrandom>;

function makeRng(seed: string | number): RNG {
  return seedrandom(String(seed));
}

function pick<T>(arr: T[], rng: RNG): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randInt(min: number, max: number, rng: RNG): number {
  return min + Math.floor(rng() * (max - min + 1));
}

// ── Music theory data ─────────────────────────────────────────────────────────

const CHORD_PROGRESSIONS: number[][] = [
  [0][5][3][4],
  [0][3][4][3],
  [5][3][0][4],
  [0][2][3][4],
  [0][5][1][4],
  [3][4][0][5],
  [0][0][3][4],
];

const SCALES: Record<string, number[]> = {
  major:      [0][2][4][5][7][9][11],
  minor:      [0][2][3][5][7][8][10],
  dorian:     [0][2][3][5][7][9][10],
  mixolydian: [0][2][4][5][7][9][10],
  pentatonic: [0][2][4][7][9],
};

const SCALE_NAMES = Object.keys(SCALES);

const RHYTHM_PATTERNS: number[][] = [
  [1][1][1][1],
  [0.5, 0.5, 1, 1, 1],
  [1, 0.5, 0.5, 1, 1],
  [2][1][1],
  [0.5, 0.5, 0.5, 0.5, 1, 1],
  [1.5, 0.5, 1, 1],
  [0.75, 0.25, 0.75, 0.25, 1, 1],
];

const MELODY_PROGRAMS  = [0][4][5][24][25][40][56][73][80];
const CHORD_PROGRAMS   = [0][4][48][52][88][89];
const BASS_PROGRAMS    = [32][33][34][35][38][39];

// ── MIDI helpers ──────────────────────────────────────────────────────────────

function varLen(n: number): number[] {
  const bytes: number[] = [];
  bytes.push(n & 0x7f);
  n >>= 7;
  while (n > 0) {
    bytes.unshift((n & 0x7f) | 0x80);
    n >>= 7;
  }
  return bytes;
}

function writeUint32(n: number): number[] {
  return [
    (n >> 24) & 0xff,
    (n >> 16) & 0xff,
    (n >> 8)  & 0xff,
    n        & 0xff,
  ];
}

function writeUint16(n: number): number[] {
  return [(n >> 8) & 0xff, n & 0xff];
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
    0x4d, 0x54, 0x72, 0x6b,   // "MTrk"
    ...writeUint32(body.length),
    ...body,
  ];
}

function noteOn(ch: number, note: number, vel: number): number[] {
  return [0x90 | (ch & 0x0f), note & 0x7f, vel & 0x7f];
}

function noteOff(ch: number, note: number): number[] {
  return [0x80 | (ch & 0x0f), note & 0x7f, 0x00];
}

function programChange(ch: number, prog: number): number[] {
  return [0xc0 | (ch & 0x0f), prog & 0x7f];
}

function tempoEvent(bpm: number): number[] {
  const us = Math.round(60_000_000 / bpm);
  return [
    0x00, 0xff, 0x51, 0x03,
    (us >> 16) & 0xff,
    (us >> 8)  & 0xff,
    us        & 0xff,
  ];
}

// ── Scale / chord helpers ─────────────────────────────────────────────────────

function scaleNote(
    root:   number,
    scale:  number[],
    degree: number,
    octave: number
): number {
  const len  = scale.length;
  const idx  = ((degree % len) + len) % len;
  const oct  = Math.floor(degree / len);
  return root + scale[idx] + (octave + oct) * 12;
}

function chordNotes(
    root:   number,
    scale:  number[],
    degree: number,
    octave: number
): number[] {
  return [0][2][4].map(d => scaleNote(root, scale, degree + d, octave));
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function generateMidiBuffer(seed: string): Promise<Buffer> {
  const rng = makeRng(seed);

  const TICKS = 480;
  const bpm   = randInt(72, 155, rng);
  const root  = randInt(48, 60, rng);

  const scaleName  = pick(SCALE_NAMES, rng);
  const scale      = SCALES[scaleName];
  const progression = pick(CHORD_PROGRESSIONS, rng);
  const bars        = 16;

  const melodyProg = pick(MELODY_PROGRAMS, rng);
  const chordProg  = pick(CHORD_PROGRAMS,  rng);
  const bassProg   = pick(BASS_PROGRAMS,   rng);
  const rhythm     = pick(RHYTHM_PATTERNS, rng);
  const melodyOct  = randInt(1, 2, rng);

  // ── Track 0: tempo ────────────────────────────────────────────────────────
  const tempoTrack: MidiEvent[] = [
    { delta: 0, data: tempoEvent(bpm) },
  ];

  // ── Track 1: melody ───────────────────────────────────────────────────────
  const melodyEvents: MidiEvent[] = [
    { delta: 0, data: programChange(0, melodyProg) },
  ];

  let melodyTick = 0;

  for (let bar = 0; bar < bars; bar++) {
    const chordDeg = progression[bar % progression.length];
    let beatPos = 0;
    let ri = 0;

    while (beatPos < 4) {
      const dur = rhythm[ri % rhythm.length];
      ri++;

      // Pick from chord tones 70% of the time, passing tones 30%
      const chordDegs = [0][2][4].map(d =>
          ((chordDeg + d) % scale.length + scale.length) % scale.length
      );
      const extraDegs = [-1, 1, 3, 5].map(d =>
          ((chordDeg + d) % scale.length + scale.length) % scale.length
      );
      const pool   = rng() < 0.7 ? chordDegs : extraDegs;
      const degree = pick(pool, rng);
      const note   = scaleNote(root, scale, degree, melodyOct + 4);
      const vel    = randInt(60, 100, rng);

      const durTicks = Math.round(dur * TICKS * 0.88);
      const gap      = Math.round(dur * TICKS * 0.12);

      melodyEvents.push({ delta: melodyTick, data: noteOn(0, note, vel) });
      melodyTick = 0;
      melodyEvents.push({ delta: durTicks,   data: noteOff(0, note) });
      melodyTick = gap;

      beatPos += dur;
      if (beatPos >= 4) break;
    }
  }

  // ── Track 2: chords ───────────────────────────────────────────────────────
  const chordEvents: MidiEvent[] = [
    { delta: 0, data: programChange(1, chordProg) },
  ];

  let chordTick = 0;

  for (let bar = 0; bar < bars; bar++) {
    const chordDeg  = progression[bar % progression.length];
    const notes     = chordNotes(root, scale, chordDeg, 4);
    const vel       = randInt(40, 70, rng);
    const barTicks  = 4 * TICKS;
    const durTicks  = Math.round(barTicks * 0.92);

    // All notes on
    chordEvents.push({ delta: chordTick, data: noteOn(1, notes[0], vel) });
    chordTick = 0;
    for (let n = 1; n < notes.length; n++) {
      chordEvents.push({ delta: 0, data: noteOn(1, notes[n], vel) });
    }
    // All notes off
    chordEvents.push({ delta: durTicks, data: noteOff(1, notes[0]) });
    for (let n = 1; n < notes.length; n++) {
      chordEvents.push({ delta: 0, data: noteOff(1, notes[n]) });
    }
    chordTick = barTicks - durTicks;
  }

  // ── Track 3: bass ─────────────────────────────────────────────────────────
  const bassEvents: MidiEvent[] = [
    { delta: 0, data: programChange(2, bassProg) },
  ];

  let bassTick = 0;

  for (let bar = 0; bar < bars; bar++) {
    const chordDeg = progression[bar % progression.length];
    const rootNote = scaleNote(root, scale, chordDeg,     3);
    const fifth    = scaleNote(root, scale, chordDeg + 4, 3);

    const beats = [
      { note: rootNote, start: 0 },
      { note: fifth,    start: 2 },
    ];

    for (let b = 0; b < beats.length; b++) {
      const { note }  = beats[b];
      const nextStart = b + 1 < beats.length ? beats[b + 1].start : 4;
      const dur       = (nextStart - beats[b].start) * TICKS;
      const vel       = randInt(55, 80, rng);
      const noteDur   = Math.round(dur * 0.85);
      const gap       = dur - noteDur;

      bassEvents.push({ delta: bassTick, data: noteOn(2, note, vel) });
      bassTick = 0;
      bassEvents.push({ delta: noteDur,  data: noteOff(2, note) });
      bassTick = gap;
    }
  }

  // ── Assemble MIDI file ────────────────────────────────────────────────────
  const header = [
    0x4d, 0x54, 0x68, 0x64,   // "MThd"
    ...writeUint32(6),         // header length always 6
    ...writeUint16(1),         // format 1 = multi-track
    ...writeUint16(4),         // 4 tracks
    ...writeUint16(TICKS),     // ticks per quarter note
  ];

  const allTracks = [
    buildTrack(tempoTrack),
    buildTrack(melodyEvents),
    buildTrack(chordEvents),
    buildTrack(bassEvents),
  ].flat();

  return Buffer.from([...header, ...allTracks]);
}


