"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMidiBuffer = void 0;
const rng_1 = require("./rng");
// ── Music theory data ─────────────────────────────────────────────────────────
const CHORD_PROGRESSIONS = [
    [0][5][3][4], // I–VI–IV–V
    [0][3][4][3], // I–IV–V–IV
    [5][3][0][4], // VI–IV–I–V
    [0][2][3][4], // I–III–IV–V
    [0][5][1][4], // I–VI–II–V
    [3][4][0][5], // IV–V–I–VI
    [0][0][3][4], // I–I–IV–V
];
const SCALES = {
    major: [0][2][4][5][7][9][11],
    minor: [0][2][3][5][7][8][10],
    dorian: [0][2][3][5][7][9][10],
    mixolydian: [0][2][4][5][7][9][10],
    pentatonic: [0][2][4][7][9],
};
const RHYTHM_PATTERNS = [
    [1][1][1][1],
    [0.5, 0.5, 1, 1, 1],
    [1, 0.5, 0.5, 1, 1],
    [2][1][1],
    [0.5, 0.5, 0.5, 0.5, 1, 1],
    [1.5, 0.5, 1, 1],
    [0.75, 0.25, 0.75, 0.25, 1, 1],
];
// MIDI note helpers
function scaleNote(root, scale, degree, octave) {
    const idx = ((degree % scale.length) + scale.length) % scale.length;
    const octaveShift = Math.floor(degree / scale.length);
    return root + scale[idx] + (octave + octaveShift) * 12;
}
function chordNotes(root, scale, degree, octave) {
    return [0][2][4].map(d => scaleNote(root, scale, degree + d, octave));
}
// ── Minimal MIDI builder (no external dep needed) ─────────────────────────────
function varLen(n) {
    const bytes = [];
    bytes.push(n & 0x7f);
    n >>= 7;
    while (n > 0) {
        bytes.unshift((n & 0x7f) | 0x80);
        n >>= 7;
    }
    return bytes;
}
function writeUint32(n) {
    return [(n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}
function writeUint16(n) {
    return [(n >> 8) & 0xff, n & 0xff];
}
function buildTrack(events) {
    const body = [];
    for (const ev of events) {
        body.push(...varLen(ev.delta), ...ev.data);
    }
    // End of track
    body.push(0x00, 0xff, 0x2f, 0x00);
    const header = [0x4d, 0x54, 0x72, 0x6b, ...writeUint32(body.length)];
    return [...header, ...body];
}
function noteOn(ch, note, vel) {
    return [0x90 | (ch & 0xf), note & 0x7f, vel & 0x7f];
}
function noteOff(ch, note) {
    return [0x80 | (ch & 0xf), note & 0x7f, 0x00];
}
function programChange(ch, prog) {
    return [0xc0 | (ch & 0xf), prog & 0x7f];
}
function tempoEvent(bpm) {
    const us = Math.round(60000000 / bpm);
    return [0x00, 0xff, 0x51, 0x03, (us >> 16) & 0xff, (us >> 8) & 0xff, us & 0xff];
}
// ── Main generator ────────────────────────────────────────────────────────────
async function generateMidiBuffer(seed) {
    const rng = (0, rng_1.makeRng)(seed);
    const TICKS = 480; // ticks per quarter note
    const bpm = (0, rng_1.randInt)(72, 155, rng);
    const root = (0, rng_1.randInt)(48, 60, rng); // C3–C4
    const scaleName = (0, rng_1.pick)(Object.keys(SCALES), rng);
    const scale = SCALES[scaleName];
    const progression = (0, rng_1.pick)(CHORD_PROGRESSIONS, rng);
    const bars = 16;
    // Instrument choices: melody, chords, bass
    const MELODY_PROGRAMS = [0][4][5][24][25][40][56][73][80];
    const CHORD_PROGRAMS = [0][4][48][52][88][89];
    const BASS_PROGRAMS = [32][33][34][35][38][39];
    const melodyProg = (0, rng_1.pick)(MELODY_PROGRAMS, rng);
    const chordProg = (0, rng_1.pick)(CHORD_PROGRAMS, rng);
    const bassProg = (0, rng_1.pick)(BASS_PROGRAMS, rng);
    const rhythmPattern = (0, rng_1.pick)(RHYTHM_PATTERNS, rng);
    const melodyOctave = (0, rng_1.randInt)(1, 2, rng); // relative octave for melody
    const chordOctave = 0;
    const bassOctave = -1;
    // ── Track 0: tempo map ──────────────────────────────────────────────────────
    const tempoTrack = [
        { delta: 0, data: tempoEvent(bpm) },
    ];
    // ── Track 1: melody ─────────────────────────────────────────────────────────
    const melodyEvents = [
        { delta: 0, data: programChange(0, melodyProg) },
    ];
    let melodyTick = 0;
    for (let bar = 0; bar < bars; bar++) {
        const chordDegree = progression[bar % progression.length];
        let beatPos = 0;
        let ri = 0;
        while (beatPos < 4) {
            const dur = rhythmPattern[ri % rhythmPattern.length];
            ri++;
            // Pick a note from the current chord or neighboring scale degrees
            const chordDegs = [0][2][4].map(d => (chordDegree + d) % scale.length);
            const extraDegs = [-1, 1, 3, 5].map(d => ((chordDegree + d) % scale.length + scale.length) % scale.length);
            const pool = rng() < 0.7 ? chordDegs : extraDegs;
            const degree = (0, rng_1.pick)(pool, rng);
            const note = scaleNote(root, scale, degree, melodyOctave + 4);
            const vel = (0, rng_1.randInt)(60, 100, rng);
            const durationTicks = Math.round(dur * TICKS * 0.9);
            const gapTicks = Math.round(dur * TICKS * 0.1);
            // note on at melodyTick (delta from last event)
            melodyEvents.push({ delta: melodyTick, data: noteOn(0, note, vel) });
            melodyTick = 0;
            melodyEvents.push({ delta: durationTicks, data: noteOff(0, note) });
            melodyTick = gapTicks;
            beatPos += dur;
            if (beatPos >= 4)
                break;
        }
    }
    // ── Track 2: chords ─────────────────────────────────────────────────────────
    const chordEvents = [
        { delta: 0, data: programChange(1, chordProg) },
    ];
    let chordTick = 0;
    for (let bar = 0; bar < bars; bar++) {
        const chordDegree = progression[bar % progression.length];
        const notes = chordNotes(root, scale, chordDegree, chordOctave + 4);
        const vel = (0, rng_1.randInt)(40, 70, rng);
        const barTicks = 4 * TICKS;
        const durationTicks = Math.round(barTicks * 0.92);
        // All chord notes on simultaneously
        chordEvents.push({ delta: chordTick, data: noteOn(1, notes[0], vel) });
        chordTick = 0;
        for (let i = 1; i < notes.length; i++) {
            chordEvents.push({ delta: 0, data: noteOn(1, notes[i], vel) });
        }
        // All off after duration
        chordEvents.push({ delta: durationTicks, data: noteOff(1, notes[0]) });
        for (let i = 1; i < notes.length; i++) {
            chordEvents.push({ delta: 0, data: noteOff(1, notes[i]) });
        }
        chordTick = barTicks - durationTicks;
    }
    // ── Track 3: bass ────────────────────────────────────────────────────────────
    const bassEvents = [
        { delta: 0, data: programChange(2, bassProg) },
    ];
    let bassTick = 0;
    for (let bar = 0; bar < bars; bar++) {
        const chordDegree = progression[bar % progression.length];
        const rootNote = scaleNote(root, scale, chordDegree, bassOctave + 3);
        const fifth = scaleNote(root, scale, chordDegree + 4, bassOctave + 3);
        // Bass pattern: root on beat 1, fifth on beat 3
        const beats = [
            { note: rootNote, beat: 0 },
            { note: fifth, beat: 2 },
        ];
        for (let b = 0; b < beats.length; b++) {
            const { note } = beats[b];
            const nextBeat = b + 1 < beats.length ? beats[b + 1].beat : 4;
            const dur = (nextBeat - beats[b].beat) * TICKS;
            const vel = (0, rng_1.randInt)(55, 80, rng);
            const noteDur = Math.round(dur * 0.85);
            const gap = dur - noteDur;
            bassEvents.push({ delta: bassTick, data: noteOn(2, note, vel) });
            bassTick = 0;
            bassEvents.push({ delta: noteDur, data: noteOff(2, note) });
            bassTick = gap;
        }
    }
    // ── Assemble MIDI file ───────────────────────────────────────────────────────
    // Header: format=1, 4 tracks, TICKS ppq
    const header = [
        0x4d, 0x54, 0x68, 0x64, // MThd
        ...writeUint32(6), // chunk length
        ...writeUint16(1), // format 1
        ...writeUint16(4), // num tracks
        ...writeUint16(TICKS), // ticks per quarter
    ];
    const tracks = [
        buildTrack(tempoTrack),
        buildTrack(melodyEvents),
        buildTrack(chordEvents),
        buildTrack(bassEvents),
    ];
    const midi = Buffer.from([...header, ...tracks.flat()]);
    return midi;
}
exports.generateMidiBuffer = generateMidiBuffer;
