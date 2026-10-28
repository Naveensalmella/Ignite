// ══════════════════════════════════════════════════════════════
// Movement library for <MoveFigure />.
//
// Angles are absolute directions in degrees, measured from straight DOWN
// rotating toward the figure's FRONT (screen right):
//     0 = down · 90 = forward · 180 = up · -90 = backward
// Pose keys:
//   t   torso (hip → shoulder)        h   head tilt relative to torso
//   ua/fa  front arm upper / forearm  ub/fb  back arm upper / forearm
//   tf/sf  front leg thigh / shin     tb/sb  back leg thigh / shin
//   kf/kb  foot angle (default: perpendicular to shin, toes forward)
//   air  lift off the ground (units) · dx  horizontal shift
// Side view: "front" limbs are the near side. Front view ("view: front"):
// front = figure's right (screen right), back = left; `sym: true` mirrors
// the right-side angles to the left automatically.
// Each pattern: { view, focus, props, anchor, frames: [{ ...pose, d }] }
//   d = ms to blend into the NEXT frame. focus = body parts drawn in accent.
// ══════════════════════════════════════════════════════════════

const STAND = { t: 180, ua: 6, fa: 8, ub: -6, fb: -4, tf: 3, sf: 0, tb: -3, sb: 0 };
const GUARD = { t: 174, ua: 35, fa: 165, ub: 15, fb: 170, tf: 16, sf: 6, tb: -22, sb: -14 };
const PLANK_HIGH = { t: 101, ua: 2, fa: 2, ub: -2, fb: -2, tf: -79, sf: -80, tb: -81, sb: -82 };
const PLANK_LOW = { t: 94, ua: -138, fa: 6, ub: -140, fb: 4, tf: -86, sf: -86, tb: -87, sb: -87 };
const FOREARM_PLANK = { t: 97, ua: 2, fa: 90, ub: -2, fb: 90, tf: -83, sf: -84, tb: -84, sb: -85 };
const SQUAT = { t: 138, ua: 92, fa: 92, ub: 88, fb: 88, tf: 82, sf: -18, tb: 78, sb: -20 };
const SUPINE_KNEES = { t: -90, ua: 90, fa: 90, ub: 92, fb: 92, tf: 140, sf: 12, tb: 136, sb: 10 };
const QUADRUPED = { t: 95, ua: 0, fa: 0, ub: -2, fb: -2, tf: 2, sf: -90, tb: -2, sb: -92 };
const KNEEL = { t: 172, ua: 30, fa: 160, ub: 10, fb: 165, tf: 2, sf: -90, tb: -2, sb: -92 };
const PRONE = { t: 90, ua: 100, fa: 100, ub: 98, fb: 98, tf: -90, sf: -90, tb: -91, sb: -91 };
const SEATED = { t: 180, ua: 25, fa: 70, ub: 20, fb: 65, tf: 88, sf: -95, tb: 84, sb: -100, kf: -80, kb: -84 };
const F_STAND = { t: 180, ua: 8, fa: 6, tf: 4, sf: 2 }; // front view, mirrored

export const PATTERNS = {
    // ── Standing & cardio ──
    stand: { focus: [], frames: [{ ...STAND, d: 1600 }, { ...STAND, t: 179, ua: 9, ub: -9, d: 1600 }] },
    walk: {
        focus: ["legs"], frames: [
            { ...STAND, ua: -22, fa: -10, ub: 22, fb: 30, tf: 24, sf: 6, tb: -20, sb: -36, d: 480 },
            { ...STAND, ua: 22, fa: 30, ub: -22, fb: -10, tf: -20, sf: -36, tb: 24, sb: 6, d: 480 },
        ],
    },
    jog: {
        focus: ["legs"], frames: [
            { t: 170, ua: -35, fa: 60, ub: 40, fb: 130, tf: 55, sf: -15, tb: -28, sb: -78, air: 2, d: 330 },
            { t: 170, ua: 40, fa: 130, ub: -35, fb: 60, tf: -28, sf: -78, tb: 55, sb: -15, air: 2, d: 330 },
        ],
    },
    high_knees: {
        focus: ["legs", "core"], frames: [
            { t: 178, ua: -30, fa: 60, ub: 50, fb: 140, tf: 95, sf: 0, tb: -2, sb: 0, air: 2, d: 260 },
            { t: 178, ua: 50, fa: 140, ub: -30, fb: 60, tf: -2, sf: 0, tb: 95, sb: 0, air: 2, d: 260 },
        ],
    },
    jumping_jack: {
        view: "front", sym: true, focus: ["legs", "arms"], frames: [
            { ...F_STAND, d: 330 },
            { t: 180, ua: 155, fa: 165, tf: 20, sf: 20, air: 5, d: 330 },
        ],
    },
    jump_rope: {
        focus: ["legs"], props: ["rope"], frames: [
            { ...STAND, ua: 12, fa: 70, ub: 8, fb: 66, tf: 2, sf: -2, tb: -2, sb: -4, kf: 30, kb: 30, d: 220 },
            { ...STAND, ua: 12, fa: 70, ub: 8, fb: 66, tf: 2, sf: -2, tb: -2, sb: -4, kf: 30, kb: 30, air: 7, d: 220, rope: 1 },
        ],
    },
    jump_squat: {
        focus: ["legs"], frames: [
            { ...SQUAT, d: 380 },
            { ...STAND, ua: 150, fa: 160, ub: 140, fb: 152, kf: 25, kb: 25, air: 14, d: 330 },
            { ...STAND, ua: 60, fa: 70, ub: 55, fb: 65, d: 300 },
        ],
    },
    burpee: {
        focus: ["full"], frames: [
            { ...STAND, d: 300 },
            { t: 112, ua: 2, fa: 0, ub: -2, fb: -2, tf: 108, sf: -40, tb: 104, sb: -42, d: 300 },
            { ...PLANK_HIGH, d: 260 },
            { ...PLANK_LOW, d: 260 },
            { ...PLANK_HIGH, d: 300 },
            { t: 112, ua: 2, fa: 0, ub: -2, fb: -2, tf: 108, sf: -40, tb: 104, sb: -42, d: 280 },
            { ...STAND, ua: 150, fa: 160, ub: 140, fb: 152, kf: 25, kb: 25, air: 12, d: 360 },
        ],
    },
    mountain_climber: {
        focus: ["core", "legs"], frames: [
            { ...PLANK_HIGH, tf: 38, sf: -62, d: 230 },
            { ...PLANK_HIGH, tb: 38, sb: -62, d: 230 },
        ],
    },
    bear_crawl: {
        focus: ["full"], frames: [
            { t: 98, ua: 12, fa: 8, ub: -10, fb: -8, tf: 25, sf: -40, tb: 5, sb: -58, d: 420 },
            { t: 98, ua: -10, fa: -8, ub: 12, fb: 8, tf: 5, sf: -58, tb: 25, sb: -40, d: 420 },
        ],
    },

    // ── Lower body ──
    squat: { focus: ["legs"], frames: [{ ...STAND, ua: 70, fa: 80, ub: 66, fb: 76, d: 800 }, { ...SQUAT, d: 800 }] },
    lunge: {
        focus: ["legs"], frames: [
            { ...STAND, tf: 18, sf: 4, tb: -14, sb: -6, d: 750 },
            { t: 178, ua: 4, fa: 4, ub: -4, fb: -2, tf: 86, sf: 0, tb: -22, sb: -96, d: 750 },
        ],
    },
    calf_raise: { focus: ["legs"], frames: [{ ...STAND, d: 650 }, { ...STAND, kf: 22, kb: 22, d: 650 }] },
    wall_sit: {
        focus: ["legs"], props: ["wall"], frames: [
            { t: 180, ua: 80, fa: 90, ub: 76, fb: 88, tf: 90, sf: 0, tb: 88, sb: -2, d: 1400 },
            { t: 179, ua: 82, fa: 92, ub: 78, fb: 90, tf: 90, sf: 0, tb: 88, sb: -2, d: 1400 },
        ],
    },
    horse_stance: {
        view: "front", sym: true, focus: ["legs"], frames: [
            { t: 180, ua: 20, fa: 150, tf: 62, sf: 6, d: 1400 },
            { t: 180, ua: 22, fa: 152, tf: 64, sf: 4, d: 1400 },
        ],
    },
    glute_bridge: {
        focus: ["legs", "core"], frames: [
            { ...SUPINE_KNEES, d: 750 },
            { ...SUPINE_KNEES, t: -68, tf: 112, sf: 6, tb: 110, sb: 4, d: 750 },
        ],
    },
    donkey_kick: {
        focus: ["legs"], frames: [
            { ...QUADRUPED, d: 550 },
            { ...QUADRUPED, tf: -105, sf: 170, kf: 175, d: 550 },
        ],
    },
    leg_swing: {
        focus: ["legs"], frames: [
            { ...STAND, ub: 90, fb: 90, tf: 70, sf: 70, d: 520 },
            { ...STAND, ub: 90, fb: 90, tf: -40, sf: -45, d: 520 },
        ],
    },

    // ── Upper body ──
    pushup: { focus: ["arms", "core"], frames: [{ ...PLANK_HIGH, d: 650 }, { ...PLANK_LOW, d: 650 }] },
    dip: {
        anchor: "hands", props: ["bars"], focus: ["arms"], frames: [
            { t: 176, ua: -8, fa: -4, ub: -10, fb: -6, tf: 15, sf: -55, tb: 10, sb: -60, d: 700 },
            { t: 166, ua: -96, fa: 2, ub: -98, fb: 0, tf: 18, sf: -55, tb: 13, sb: -60, d: 700 },
        ],
    },
    pull_up: {
        anchor: "hands", props: ["bar"], focus: ["arms"], frames: [
            { t: 180, ua: 172, fa: 176, ub: 168, fb: 174, tf: 8, sf: -28, tb: 4, sb: -32, d: 750 },
            { t: 182, ua: 25, fa: 172, ub: 20, fb: 168, tf: 10, sf: -30, tb: 6, sb: -34, d: 750 },
        ],
    },
    row: {
        focus: ["arms"], props: ["dumbbells"], frames: [
            { t: 132, ua: 0, fa: 0, ub: -2, fb: -2, tf: 14, sf: -6, tb: 10, sb: -8, d: 650 },
            { t: 132, ua: -58, fa: 0, ub: -60, fb: -2, tf: 14, sf: -6, tb: 10, sb: -8, d: 650 },
        ],
    },
    curl: {
        focus: ["arms"], props: ["dumbbells"], frames: [
            { ...STAND, ua: 2, fa: 2, ub: -2, fb: 0, d: 650 },
            { ...STAND, ua: 6, fa: 158, ub: 2, fb: 154, d: 650 },
        ],
    },
    overhead_press: {
        view: "front", sym: true, focus: ["arms"], props: ["dumbbells"], frames: [
            { ...F_STAND, ua: 92, fa: 176, d: 650 },
            { ...F_STAND, ua: 162, fa: 168, d: 650 },
        ],
    },
    lateral_raise: {
        view: "front", sym: true, focus: ["arms"], props: ["dumbbells"], frames: [
            { ...F_STAND, ua: 10, fa: 14, d: 700 },
            { ...F_STAND, ua: 88, fa: 92, d: 700 },
        ],
    },
    deadlift: {
        focus: ["legs", "core"], props: ["barbell"], frames: [
            { ...STAND, ua: 2, fa: 2, ub: 0, fb: 0, d: 800 },
            { t: 118, ua: 2, fa: 2, ub: 0, fb: 0, tf: 42, sf: -4, tb: 38, sb: -6, d: 800 },
        ],
    },

    // ── Core ──
    plank: { focus: ["core"], frames: [{ ...FOREARM_PLANK, d: 1300 }, { ...FOREARM_PLANK, t: 98, d: 1300 }] },
    side_plank: {
        focus: ["core"], frames: [
            { t: 112, ua: 0, fa: 0, ub: 178, fb: 178, tf: -68, sf: -68, tb: -70, sb: -70, d: 1300 },
            { t: 114, ua: 0, fa: 0, ub: 175, fb: 176, tf: -66, sf: -66, tb: -68, sb: -68, d: 1300 },
        ],
    },
    crunch: {
        focus: ["core"], frames: [
            { ...SUPINE_KNEES, ua: -40, fa: 120, ub: -42, fb: 118, d: 650 },
            { ...SUPINE_KNEES, t: -128, ua: -70, fa: 100, ub: -72, fb: 98, d: 650 },
        ],
    },
    leg_raise: {
        focus: ["core"], frames: [
            { t: -90, ua: 90, fa: 90, ub: 92, fb: 92, tf: 92, sf: 92, tb: 90, sb: 90, d: 800 },
            { t: -90, ua: 90, fa: 90, ub: 92, fb: 92, tf: 175, sf: 175, tb: 172, sb: 172, d: 800 },
        ],
    },
    bicycle: {
        focus: ["core"], frames: [
            { t: -118, ua: -60, fa: 110, ub: -62, fb: 108, tf: 160, sf: 60, tb: 100, sb: 100, d: 450 },
            { t: -118, ua: -60, fa: 110, ub: -62, fb: 108, tf: 100, sf: 100, tb: 160, sb: 60, d: 450 },
        ],
    },
    russian_twist: {
        focus: ["core"], frames: [
            { t: -150, ua: 120, fa: 110, ub: 112, fb: 104, tf: 132, sf: 80, tb: 128, sb: 76, d: 500 },
            { t: -146, ua: 70, fa: 50, ub: 64, fb: 46, tf: 132, sf: 80, tb: 128, sb: 76, d: 500 },
        ],
    },
    superman: {
        focus: ["core"], frames: [
            { ...PRONE, d: 750 },
            { t: 104, ua: 112, fa: 114, ub: 110, fb: 112, tf: -78, sf: -76, tb: -79, sb: -77, d: 750 },
        ],
    },
    flutter_kick: {
        focus: ["core", "legs"], frames: [
            { t: -95, ua: 90, fa: 90, ub: 92, fb: 92, tf: 112, sf: 112, tb: 96, sb: 96, d: 220 },
            { t: -95, ua: 90, fa: 90, ub: 92, fb: 92, tf: 96, sf: 96, tb: 112, sb: 112, d: 220 },
        ],
    },

    // ── Combat ──
    boxing_stance: {
        focus: ["legs"], frames: [
            { ...GUARD, d: 300 },
            { ...GUARD, air: 3, dx: 2, d: 300 },
            { ...GUARD, d: 300 },
            { ...GUARD, air: 3, dx: -2, d: 300 },
        ],
    },
    jab_cross: {
        focus: ["arms"], frames: [
            { ...GUARD, d: 160 },
            { ...GUARD, ua: 94, fa: 94, d: 220 },
            { ...GUARD, d: 160 },
            { ...GUARD, t: 166, ub: 96, fb: 96, tb: -16, sb: -10, kb: 40, d: 240 },
            { ...GUARD, d: 380 },
        ],
    },
    hook_uppercut: {
        focus: ["arms", "core"], frames: [
            { ...GUARD, d: 180 },
            { ...GUARD, t: 168, ua: 92, fa: 150, d: 240 },
            { ...GUARD, d: 180 },
            { ...GUARD, t: 170, ub: 40, fb: 172, tf: 24, sf: -4, tb: -16, sb: -24, d: 140 },
            { ...GUARD, t: 176, ub: 120, fb: 176, d: 260 },
            { ...GUARD, d: 360 },
        ],
    },
    shadow_boxing: {
        focus: ["arms", "legs"], frames: [
            { ...GUARD, d: 150 },
            { ...GUARD, ua: 94, fa: 94, d: 170 },
            { ...GUARD, d: 130 },
            { ...GUARD, t: 166, ub: 96, fb: 96, kb: 40, d: 190 },
            { ...GUARD, d: 160 },
            { ...GUARD, t: 168, ua: 92, fa: 150, d: 200 },
            { ...GUARD, t: 158, tf: 40, sf: -10, tb: -10, sb: -30, d: 260 },
            { ...GUARD, air: 3, d: 300 },
        ],
    },
    front_kick: {
        focus: ["legs"], frames: [
            { ...GUARD, d: 260 },
            { ...GUARD, t: 186, tf: 100, sf: 0, d: 200 },
            { ...GUARD, t: 192, tf: 98, sf: 96, kf: 170, d: 260 },
            { ...GUARD, t: 186, tf: 100, sf: 0, d: 220 },
            { ...GUARD, d: 400 },
        ],
    },
    roundhouse_kick: {
        focus: ["legs", "core"], frames: [
            { ...GUARD, d: 260 },
            { ...GUARD, t: 196, ub: -20, fb: -10, tf: 80, sf: -40, tb: -10, sb: -6, d: 200 },
            { ...GUARD, t: 212, ub: -40, fb: -30, tf: 108, sf: 104, kf: 150, tb: -14, sb: -6, d: 280 },
            { ...GUARD, t: 196, tf: 80, sf: -40, d: 220 },
            { ...GUARD, d: 400 },
        ],
    },
    side_kick: {
        focus: ["legs"], frames: [
            { ...GUARD, d: 260 },
            { ...GUARD, t: 200, tf: 125, sf: -40, d: 230 },
            { ...GUARD, t: 228, ua: 60, fa: 120, tf: 94, sf: 92, kf: 10, d: 280 },
            { ...GUARD, t: 200, tf: 125, sf: -40, d: 230 },
            { ...GUARD, d: 400 },
        ],
    },
    knee_strike: {
        focus: ["legs", "core"], frames: [
            { ...GUARD, d: 280 },
            { t: 168, ua: 110, fa: 40, ub: 108, fb: 36, tf: 10, sf: 0, tb: 105, sb: -10, kb: 60, d: 280 },
            { ...GUARD, d: 380 },
        ],
    },
    elbow_strike: {
        focus: ["arms", "core"], frames: [
            { ...GUARD, d: 260 },
            { ...GUARD, t: 166, ua: 96, fa: -80, d: 240 },
            { ...GUARD, d: 260 },
            { ...GUARD, t: 168, ub: 100, fb: -70, kb: 40, d: 240 },
            { ...GUARD, d: 360 },
        ],
    },
    clinch: {
        focus: ["arms", "legs"], frames: [
            { t: 164, ua: 122, fa: 70, ub: 118, fb: 66, tf: 12, sf: 0, tb: -16, sb: -10, d: 380 },
            { t: 162, ua: 112, fa: 50, ub: 108, fb: 46, tf: 12, sf: 0, tb: 104, sb: -8, kb: 60, d: 300 },
            { t: 164, ua: 122, fa: 70, ub: 118, fb: 66, tf: 12, sf: 0, tb: -16, sb: -10, d: 380 },
        ],
    },
    sprawl: {
        focus: ["full"], frames: [
            { ...GUARD, d: 260 },
            { t: 118, ua: 2, fa: 0, ub: -2, fb: -2, tf: -96, sf: -94, tb: -98, sb: -96, d: 320 },
            { t: 140, ua: 30, fa: 20, ub: 28, fb: 18, tf: 60, sf: -40, tb: -40, sb: -70, d: 260 },
            { ...GUARD, d: 380 },
        ],
    },
    level_change: {
        focus: ["legs"], frames: [
            { ...GUARD, d: 300 },
            { t: 150, ua: 92, fa: 96, ub: 88, fb: 92, tf: 88, sf: 4, tb: -30, sb: -95, d: 380 },
            { ...GUARD, d: 380 },
        ],
    },
    ground_strikes: {
        focus: ["arms"], props: ["mat"], frames: [
            { ...KNEEL, d: 220 },
            { ...KNEEL, t: 160, ua: 70, fa: 40, d: 200 },
            { ...KNEEL, d: 200 },
            { ...KNEEL, t: 158, ub: 72, fb: 42, d: 220 },
        ],
    },
    block: {
        focus: ["arms"], frames: [
            { ...GUARD, d: 260 },
            { ...GUARD, ua: 150, fa: 96, d: 300 },
            { ...GUARD, d: 260 },
            { ...GUARD, t: 168, ua: 40, fa: 20, d: 300 },
        ],
    },

    // ── Yoga & mobility ──
    warrior: {
        focus: ["legs", "arms"], props: ["mat"], frames: [
            { t: 180, ua: 92, fa: 92, ub: -92, fb: -92, tf: 82, sf: 0, tb: -52, sb: -52, d: 1500 },
            { t: 178, ua: 172, fa: 176, ub: 168, fb: 174, tf: 82, sf: 0, tb: -52, sb: -52, d: 1500 },
        ],
    },
    tree_pose: {
        view: "front", focus: ["legs", "core"], frames: [
            { t: 180, ua: 40, fa: -120, ub: -40, fb: 120, tf: 2, sf: 0, tb: -60, sb: 70, kb: 90, d: 1500 },
            { t: 180, ua: 170, fa: 186, ub: -170, fb: -186, tf: 2, sf: 0, tb: -60, sb: 70, kb: 90, d: 1500 },
        ],
    },
    downward_dog: {
        focus: ["legs", "arms"], props: ["mat"], frames: [
            { t: 46, ua: 46, fa: 46, ub: 44, fb: 44, tf: -36, sf: -36, tb: -38, sb: -38, d: 1300 },
            { t: 48, ua: 48, fa: 48, ub: 46, fb: 46, tf: -32, sf: -40, tb: -38, sb: -38, kf: 20, d: 1300 },
        ],
    },
    child_pose: {
        focus: ["core"], props: ["mat"], frames: [
            { t: 72, h: 10, ua: 96, fa: 92, ub: 94, fb: 90, tf: 66, sf: -90, tb: 64, sb: -91, d: 1600 },
            { t: 76, h: 10, ua: 98, fa: 92, ub: 96, fb: 90, tf: 66, sf: -90, tb: 64, sb: -91, d: 1600 },
        ],
    },
    cobra: {
        focus: ["core"], props: ["mat"], frames: [
            { ...PRONE, ua: -150, fa: 10, ub: -152, fb: 8, d: 1000 },
            { t: 128, h: -20, ua: 8, fa: 4, ub: 6, fb: 2, tf: -90, sf: -90, tb: -91, sb: -91, d: 1300 },
        ],
    },
    cat_cow: {
        focus: ["core"], props: ["mat"], frames: [
            { ...QUADRUPED, t: 100, h: 35, d: 1100 },
            { ...QUADRUPED, t: 90, h: -35, d: 1100 },
        ],
    },
    forward_fold: {
        focus: ["legs"], frames: [
            { ...STAND, ua: 150, fa: 158, ub: 142, fb: 150, d: 1000 },
            { t: 12, h: 0, ua: 4, fa: 2, ub: 2, fb: 0, tf: -6, sf: 0, tb: -8, sb: 0, d: 1300 },
        ],
    },
    side_stretch: {
        view: "front", focus: ["core", "arms"], frames: [
            { t: 180, ua: 8, fa: 6, ub: -8, fb: -6, tf: 6, sf: 4, tb: -6, sb: -4, d: 900 },
            { t: 202, ua: 10, fa: 20, ub: -150, fb: -118, tf: 6, sf: 4, tb: -6, sb: -4, d: 1200 },
            { t: 180, ua: 8, fa: 6, ub: -8, fb: -6, tf: 6, sf: 4, tb: -6, sb: -4, d: 900 },
            { t: 158, ua: 150, fa: 118, ub: -10, fb: -20, tf: 6, sf: 4, tb: -6, sb: -4, d: 1200 },
        ],
    },
    arm_circles: {
        view: "front", sym: true, focus: ["arms"], frames: [
            { ...F_STAND, ua: 90, fa: 90, d: 250 },
            { ...F_STAND, ua: 108, fa: 112, d: 250 },
            { ...F_STAND, ua: 90, fa: 90, d: 250 },
            { ...F_STAND, ua: 72, fa: 68, d: 250 },
        ],
    },
    hip_circles: {
        view: "front", sym: true, focus: ["core"], frames: [
            { t: 180, ua: 30, fa: -40, tf: 12, sf: 4, dx: -4, d: 450 },
            { t: 186, ua: 30, fa: -40, tf: 12, sf: 4, dx: 0, d: 450 },
            { t: 180, ua: 30, fa: -40, tf: 12, sf: 4, dx: 4, d: 450 },
            { t: 174, ua: 30, fa: -40, tf: 12, sf: 4, dx: 0, d: 450 },
        ],
    },
    meditate: {
        focus: [], props: ["mat", "breath"], frames: [
            { ...SEATED, d: 2200, breath: 0 },
            { ...SEATED, t: 181, d: 2200, breath: 1 },
        ],
    },
    lying_rest: {
        focus: [], props: ["mat", "breath"], frames: [
            { t: -90, ua: 96, fa: 94, ub: 98, fb: 96, tf: 88, sf: 90, tb: 90, sb: 92, kf: 150, kb: 150, d: 2400, breath: 0 },
            { t: -90, ua: 96, fa: 94, ub: 98, fb: 96, tf: 88, sf: 90, tb: 90, sb: 92, kf: 150, kb: 150, d: 2400, breath: 1 },
        ],
    },
};

export const PATTERN_NAMES = Object.keys(PATTERNS);
