// Movement pattern for any exercise name (drives <MoveFigure> and the STR/AGI/VIT stat split).
// Deliberately data-free: the Home screen's stat sheet imports this, so it must stay small.
const RULES = [
    [/burpee|sprawl burpee/, "burpee"], [/sprawl/, "sprawl"], [/mountain climber/, "mountain_climber"], [/bear crawl|crawl/, "bear_crawl"],
    [/jumping jack|star jump/, "jumping_jack"], [/jump rope|skip(ping)? rope|rope jump/, "jump_rope"], [/high knee/, "high_knees"],
    [/jump squat|squat jump|tuck jump|box jump|broad jump/, "jump_squat"], [/wall sit/, "wall_sit"], [/horse stance/, "horse_stance"],
    [/sprint|run|jog|fartlek|tempo/, "jog"], [/walk(?!ing lunge)/, "walk"],
    [/teep|front kick|snap kick|push kick/, "front_kick"], [/side kick|back kick/, "side_kick"], [/kick/, "roundhouse_kick"],
    [/knee strike|knees?\b(?! raise)|clinch knee/, "knee_strike"], [/elbow/, "elbow_strike"], [/clinch/, "clinch"],
    [/takedown|double leg|single leg|penetration|level change|shoot/, "level_change"],
    [/ground|mount|guard|submission|armbar|choke|grappl|gnp|pound/, "ground_strikes"], [/block|parry|check|defen[cs]e/, "block"],
    [/hook|uppercut|body shot/, "hook_uppercut"], [/jab|cross|punch|1-2/, "jab_cross"], [/shadow|spar|combo|fight|boxing|strike/, "shadow_boxing"],
    [/stance|footwork|pivot|movement/, "boxing_stance"],
    [/push ?-?up|press ?-?up/, "pushup"], [/dip/, "dip"], [/pull ?-?up|chin ?-?up|muscle ?-?up/, "pull_up"],
    [/deadlift|good morning|hinge|swing/, "deadlift"], [/row|pulldown|pull down|face pull/, "row"], [/curl/, "curl"],
    [/lateral raise|side raise|fly|flye/, "lateral_raise"], [/press|overhead|military|push press|thruster|extension/, "overhead_press"],
    [/lunge|split squat|step ?-?up/, "lunge"], [/calf/, "calf_raise"], [/squat|leg press/, "squat"],
    [/bridge|hip thrust/, "glute_bridge"], [/donkey|kickback|fire hydrant/, "donkey_kick"], [/leg swing/, "leg_swing"],
    [/side plank/, "side_plank"], [/plank|hold/, "plank"], [/bicycle/, "bicycle"], [/russian twist|twist/, "russian_twist"],
    [/flutter|scissor/, "flutter_kick"], [/leg raise|v-?up|toe touch|knee raise/, "leg_raise"], [/crunch|sit ?-?up|ab /, "crunch"],
    [/superman|back extension|y-raise/, "superman"],
    [/warrior|lunge pose/, "warrior"], [/tree pose|balance/, "tree_pose"], [/downward dog|down dog/, "downward_dog"],
    [/child/, "child_pose"], [/cobra|up dog|upward dog/, "cobra"], [/cat|cow/, "cat_cow"], [/forward fold|toe touch|hamstring/, "forward_fold"],
    [/arm circle|shoulder roll/, "arm_circles"], [/hip circle/, "hip_circles"], [/savasana|lying|rest/, "lying_rest"],
    [/meditat|breath|pranayama|mindful/, "meditate"], [/stretch|mobility|yoga|flow|salutation/, "side_stretch"],
];
const ANIM_FALLBACK = { push: "pushup", squat: "squat", plank: "plank", burpee: "burpee", punch: "shadow_boxing", kick: "roundhouse_kick", run: "jog", yoga: "side_stretch", hiit: "burpee" };

export function classifyPattern(name, hint = {}) {
    const n = String(name || "").toLowerCase();
    for (const [re, p] of RULES) if (re.test(n)) return p;
    if (hint.anim && ANIM_FALLBACK[hint.anim]) return ANIM_FALLBACK[hint.anim];
    const bp = hint.bodyPart;
    return bp === "legs" || bp === "glutes" ? "squat" : bp === "core" ? "crunch" : bp === "cardio" ? "jog" : bp === "chest" ? "pushup" : bp === "back" ? "row" : bp === "arms" ? "curl" : bp === "shoulders" ? "overhead_press" : "stand";
}

