// ═══════════════════════════════════════
// IGNITE — Smart Workout System
// Exercise database + Workout Generator
// ═══════════════════════════════════════

// All exercises: { name, sets, reps, cal, muscle, bodyPart, equipment, difficulty, anim, steps, tips }
// difficulty: 1=beginner, 2=intermediate, 3=advanced

export const EXERCISES = {
  bodyweight: {
    chest: [
      {name:"Standard Push-ups",sets:3,reps:15,cal:8,muscle:"Chest, Triceps",bodyPart:"chest",difficulty:1,anim:"push",
        steps:["Plank position, hands shoulder-width","Lower chest to ground","Push back up explosively"],tips:["Keep core tight","Elbows at 45°"]},
      {name:"Wide Push-ups",sets:3,reps:12,cal:8,muscle:"Outer Chest",bodyPart:"chest",difficulty:1,anim:"push",
        steps:["Hands wider than shoulders","Lower chest between hands","Push up with chest focus"],tips:["Feel the stretch at bottom","Don't flare elbows past 90°"]},
      {name:"Diamond Push-ups",sets:3,reps:10,cal:10,muscle:"Inner Chest, Triceps",bodyPart:"chest",difficulty:2,anim:"push",
        steps:["Hands together forming diamond","Lower chest to hands","Push up, squeeze triceps"],tips:["Keep elbows close","Harder than standard — scale if needed"]},
      {name:"Decline Push-ups",sets:3,reps:12,cal:10,muscle:"Upper Chest, Shoulders",bodyPart:"chest",difficulty:2,anim:"push",
        steps:["Feet elevated on chair/step","Hands on ground, shoulder-width","Lower and push up"],tips:["Higher feet = harder","Keep core engaged"]},
      {name:"Archer Push-ups",sets:3,reps:8,cal:12,muscle:"Chest, Single-arm Prep",bodyPart:"chest",difficulty:3,anim:"push",
        steps:["Wide position, bend one arm while other stays straight","Lower toward bending arm","Push back, switch sides"],tips:["Bridge to one-arm push-ups","Keep assist arm straight"]},
      {name:"Clap Push-ups",sets:3,reps:8,cal:12,muscle:"Explosive Chest Power",bodyPart:"chest",difficulty:3,anim:"push",
        steps:["Push-up, explode off ground","Clap hands at peak","Land soft, immediate next rep"],tips:["Start without clap first","Land with soft elbows"]},
    ],
    back: [
      {name:"Superman Hold",sets:3,reps:15,cal:6,muscle:"Lower Back, Erectors",bodyPart:"back",difficulty:1,anim:"plank",
        steps:["Lie face down, arms extended","Lift arms, chest and legs off ground","Hold 2 seconds, lower"],tips:["Squeeze glutes at top","Don't hyperextend neck"]},
      {name:"Reverse Snow Angels",sets:3,reps:12,cal:6,muscle:"Upper Back, Rear Delts",bodyPart:"back",difficulty:1,anim:"plank",
        steps:["Lie face down, arms at sides","Sweep arms overhead in arc while lifted","Return to sides"],tips:["Keep arms off the ground","Squeeze shoulder blades"]},
      {name:"Inverted Rows (table/bar)",sets:3,reps:12,cal:10,muscle:"Back, Biceps",bodyPart:"back",difficulty:2,anim:"push",
        steps:["Hang under a table or low bar","Pull chest to bar","Lower with control"],tips:["Keep body straight","Closer to horizontal = harder"]},
      {name:"Pull-ups",sets:3,reps:8,cal:12,muscle:"Lats, Biceps, Grip",bodyPart:"back",difficulty:2,anim:"push",
        steps:["Hang from bar, overhand grip","Pull chin above bar","Lower with control"],tips:["Start with negatives if can't do full","Don't swing"]},
      {name:"Chin-ups",sets:3,reps:8,cal:12,muscle:"Biceps, Lats",bodyPart:"back",difficulty:2,anim:"push",
        steps:["Underhand grip on bar","Pull chin above bar","Control the descent"],tips:["Easier than pull-ups","Great bicep builder"]},
    ],
    shoulders: [
      {name:"Pike Push-ups",sets:3,reps:10,cal:8,muscle:"Shoulders, Triceps",bodyPart:"shoulders",difficulty:1,anim:"push",
        steps:["Downward dog position, hips high","Bend elbows, head toward ground","Push back up"],tips:["Foundation for handstand push-ups","Keep legs straight"]},
      {name:"Shoulder Taps",sets:3,reps:20,cal:6,muscle:"Shoulders, Core",bodyPart:"shoulders",difficulty:1,anim:"plank",
        steps:["Push-up position","Tap left shoulder with right hand","Alternate, stay stable"],tips:["Don't rotate hips","Wider feet = easier"]},
      {name:"Hindu Push-ups",sets:3,reps:10,cal:10,muscle:"Shoulders, Chest, Back",bodyPart:"shoulders",difficulty:2,anim:"push",
        steps:["Downward dog → swoop forward → upward dog","Reverse the motion back","Flowing movement"],tips:["One fluid motion","Great for shoulder mobility"]},
      {name:"Handstand Push-ups (wall)",sets:3,reps:5,cal:14,muscle:"Shoulders, Triceps",bodyPart:"shoulders",difficulty:3,anim:"push",
        steps:["Kick up into handstand against wall","Lower head to ground","Press back up"],tips:["Use a pillow under head","Master pike push-ups first"]},
    ],
    arms: [
      {name:"Tricep Dips (chair)",sets:3,reps:12,cal:8,muscle:"Triceps",bodyPart:"arms",difficulty:1,anim:"push",
        steps:["Hands on chair edge behind you","Lower body by bending elbows","Press back up"],tips:["Keep back close to chair","Don't go too deep"]},
      {name:"Chin-up Hold",sets:3,reps:20,cal:6,muscle:"Biceps, Forearms",bodyPart:"arms",difficulty:1,anim:"plank",
        steps:["Hang from bar, chin above","Hold position as long as possible","Slowly lower"],tips:["Builds isometric bicep strength","Keep core tight"]},
      {name:"Close-grip Push-ups",sets:3,reps:12,cal:8,muscle:"Triceps, Inner Chest",bodyPart:"arms",difficulty:2,anim:"push",
        steps:["Hands closer than shoulder width","Lower with elbows tight","Push up, focus on triceps"],tips:["Keep elbows pointing back","Feel the tricep burn"]},
      {name:"Bodyweight Curls (towel)",sets:3,reps:10,cal:8,muscle:"Biceps",bodyPart:"arms",difficulty:2,anim:"push",
        steps:["Loop towel over bar/door","Hold both ends, lean back","Curl yourself up"],tips:["Control the angle for difficulty","Squeeze biceps at top"]},
    ],
    core: [
      {name:"Plank Hold",sets:3,reps:30,cal:5,muscle:"Core, Shoulders",bodyPart:"core",difficulty:1,anim:"plank",timed:true,
        steps:["Forearm plank, straight line","Squeeze everything — glutes, core, quads","Hold steady"],tips:["If shaking, you're doing it right","Don't let hips sag"]},
      {name:"Crunches",sets:3,reps:20,cal:6,muscle:"Upper Abs",bodyPart:"core",difficulty:1,anim:"push",
        steps:["Lie on back, knees bent","Curl shoulders off ground","Lower with control"],tips:["Don't pull on neck","Short range of motion is fine"]},
      {name:"Leg Raises",sets:3,reps:12,cal:8,muscle:"Lower Abs, Hip Flexors",bodyPart:"core",difficulty:2,anim:"push",
        steps:["Lie flat, legs straight","Raise legs to 90 degrees","Lower slowly, don't touch ground"],tips:["Press lower back into floor","Harder = slower"]},
      {name:"Mountain Climbers",sets:3,reps:30,cal:10,muscle:"Core, Cardio",bodyPart:"core",difficulty:1,anim:"burpee",
        steps:["Push-up position","Drive knees to chest alternately","Fast pace like running"],tips:["Keep hips level","The faster, the more cardio"]},
      {name:"Russian Twists",sets:3,reps:20,cal:8,muscle:"Obliques",bodyPart:"core",difficulty:2,anim:"squat",
        steps:["Sit, lean back 45°, feet off ground","Rotate torso side to side","Touch ground each side"],tips:["Hold a weight for more challenge","Keep core braced"]},
      {name:"Dragon Flag Negatives",sets:3,reps:5,cal:12,muscle:"Full Core Chain",bodyPart:"core",difficulty:3,anim:"plank",
        steps:["Lie on bench, grip behind head","Lift body rigid and straight","Lower SLOWLY, body stays straight"],tips:["Bruce Lee's signature move","Start with bent knees"]},
    ],
    legs: [
      {name:"Bodyweight Squats",sets:4,reps:20,cal:10,muscle:"Quads, Glutes",bodyPart:"legs",difficulty:1,anim:"squat",
        steps:["Feet shoulder-width, toes slight out","Sit back and down, thighs parallel","Drive through heels to stand"],tips:["Chest up, back straight","Knees track over toes"]},
      {name:"Lunges",sets:3,reps:12,cal:8,muscle:"Quads, Glutes, Balance",bodyPart:"legs",difficulty:1,anim:"squat",
        steps:["Step forward, lower back knee","Front knee stays over ankle","Push through front heel to return"],tips:["Keep torso upright","Alternate legs each rep"]},
      {name:"Jump Squats",sets:3,reps:15,cal:14,muscle:"Quads, Explosive Power",bodyPart:"legs",difficulty:2,anim:"squat",
        steps:["Squat deep, then explode into jump","Land soft on balls of feet","Immediately squat into next rep"],tips:["Land quietly","Go deep for max power"]},
      {name:"Bulgarian Split Squats",sets:3,reps:10,cal:12,muscle:"Quads, Glutes, Balance",bodyPart:"legs",difficulty:2,anim:"squat",
        steps:["Rear foot on elevated surface","Lower until front thigh parallel","Drive up through front heel"],tips:["Further front foot = more glute","Keep torso upright"]},
      {name:"Pistol Squats",sets:3,reps:6,cal:14,muscle:"Single Leg Mastery",bodyPart:"legs",difficulty:3,anim:"squat",
        steps:["Stand on one leg, other extended","Lower all the way down","Stand back up without help"],tips:["Hold counterweight for balance","Ankle mobility is key"]},
      {name:"Calf Raises",sets:3,reps:20,cal:6,muscle:"Calves",bodyPart:"legs",difficulty:1,anim:"squat",
        steps:["Stand on edge of step, heels hanging","Rise up on toes","Lower below step level"],tips:["Pause at top, squeeze calves","Slow negatives build more"]},
    ],
    glutes: [
      {name:"Glute Bridges",sets:3,reps:15,cal:8,muscle:"Glutes, Hamstrings",bodyPart:"glutes",difficulty:1,anim:"push",
        steps:["Lie on back, knees bent, feet flat","Drive hips up, squeeze glutes","Lower with control"],tips:["Hold 2 sec at top","Push through heels"]},
      {name:"Single-leg Glute Bridge",sets:3,reps:10,cal:10,muscle:"Glutes, Balance",bodyPart:"glutes",difficulty:2,anim:"push",
        steps:["One leg extended, other foot flat","Drive hips up on standing leg","Lower slowly"],tips:["Don't let hips rotate","Much harder than bilateral"]},
      {name:"Donkey Kicks",sets:3,reps:15,cal:6,muscle:"Glutes",bodyPart:"glutes",difficulty:1,anim:"kick",
        steps:["All fours position","Kick one leg back and up","Squeeze glute at top, lower"],tips:["Don't arch back","Control the movement"]},
      {name:"Fire Hydrants",sets:3,reps:12,cal:6,muscle:"Glute Med, Hip",bodyPart:"glutes",difficulty:1,anim:"kick",
        steps:["All fours, lift knee to side","Keep 90° knee bend","Lower with control"],tips:["Great for hip mobility","Keep core stable"]},
    ],
    cardio: [
      {name:"Burpees",sets:3,reps:10,cal:12,muscle:"Full Body Cardio",bodyPart:"cardio",difficulty:2,anim:"burpee",
        steps:["Drop to squat, hands on floor","Jump feet back to plank","Push-up, jump feet forward, jump up"],tips:["Flow between movements","Scale by removing push-up"]},
      {name:"Jumping Jacks",sets:3,reps:30,cal:8,muscle:"Cardio, Coordination",bodyPart:"cardio",difficulty:1,anim:"burpee",
        steps:["Jump feet out, arms overhead","Jump back together","Continuous rhythm"],tips:["Land softly","Keep arms straight overhead"]},
      {name:"High Knees",sets:3,reps:30,cal:10,muscle:"Cardio, Hip Flexors",bodyPart:"cardio",difficulty:1,anim:"burpee",
        steps:["Run in place, knees waist high","Pump arms in sync","Fast pace"],tips:["Stay on balls of feet","Higher knees = harder"]},
      {name:"Tuck Jumps",sets:3,reps:10,cal:14,muscle:"Explosive Cardio",bodyPart:"cardio",difficulty:2,anim:"burpee",
        steps:["Jump high, pull knees to chest","Land soft, immediately jump again","Maximum height each time"],tips:["Focus on height not speed","Land on balls of feet"]},
      {name:"Sprint in Place",sets:3,reps:30,cal:12,muscle:"Max Cardio",bodyPart:"cardio",difficulty:1,anim:"burpee",timed:true,
        steps:["Sprint as fast as possible in place","Pump arms hard","30 seconds all-out"],tips:["Go absolutely maximum effort","Rest fully between sets"]},
    ],
  },
  gym: {
    chest: [
      {name:"Barbell Bench Press",sets:4,reps:10,cal:12,muscle:"Chest, Triceps, Shoulders",bodyPart:"chest",difficulty:2,anim:"push",
        steps:["Lie flat, grip bar shoulder-width+","Lower bar to mid-chest","Press up to lockout"],tips:["Plant feet firmly","Arch upper back slightly"]},
      {name:"Incline Dumbbell Press",sets:3,reps:12,cal:10,muscle:"Upper Chest",bodyPart:"chest",difficulty:2,anim:"push",
        steps:["Incline bench at 30-45°","Press dumbbells from chest to overhead","Lower with control"],tips:["Don't go too steep","Feel upper chest working"]},
      {name:"Dumbbell Flyes",sets:3,reps:12,cal:8,muscle:"Chest Stretch & Squeeze",bodyPart:"chest",difficulty:1,anim:"push",
        steps:["Flat bench, arms extended above","Open arms wide with slight elbow bend","Squeeze chest to bring back together"],tips:["Don't go too deep","Control the stretch"]},
      {name:"Cable Crossovers",sets:3,reps:12,cal:8,muscle:"Inner Chest",bodyPart:"chest",difficulty:2,anim:"push",
        steps:["Stand between cables, slight lean forward","Bring handles together in front of chest","Control the return"],tips:["Squeeze hard at center","Slight lean = more chest"]},
    ],
    back: [
      {name:"Lat Pulldown",sets:4,reps:12,cal:10,muscle:"Lats, Upper Back",bodyPart:"back",difficulty:1,anim:"push",
        steps:["Wide overhand grip on bar","Pull bar to upper chest","Control the return up"],tips:["Lead with elbows","Don't lean too far back"]},
      {name:"Barbell Rows",sets:4,reps:10,cal:12,muscle:"Mid Back, Lats",bodyPart:"back",difficulty:2,anim:"push",
        steps:["Hinge forward, grip bar overhand","Row bar to lower chest","Lower with control"],tips:["Keep back flat","Don't use momentum"]},
      {name:"Seated Cable Row",sets:3,reps:12,cal:10,muscle:"Mid Back, Rhomboids",bodyPart:"back",difficulty:1,anim:"push",
        steps:["Sit upright, grip handles","Pull to stomach, squeeze shoulder blades","Return with control"],tips:["Don't round forward","Pinch shoulder blades"]},
      {name:"Dumbbell Rows",sets:3,reps:10,cal:10,muscle:"Lats, Rear Delt",bodyPart:"back",difficulty:1,anim:"push",
        steps:["One hand and knee on bench","Row dumbbell to hip","Lower with control"],tips:["Keep elbow close to body","Full range of motion"]},
    ],
    shoulders: [
      {name:"Overhead Press (barbell)",sets:4,reps:10,cal:10,muscle:"Shoulders, Triceps",bodyPart:"shoulders",difficulty:2,anim:"push",
        steps:["Bar at collarbone height","Press overhead to lockout","Lower with control"],tips:["Squeeze glutes for stability","Don't lean back"]},
      {name:"Lateral Raises",sets:3,reps:15,cal:6,muscle:"Side Delts",bodyPart:"shoulders",difficulty:1,anim:"push",
        steps:["Light dumbbells at sides","Raise arms to shoulder height","Lower slowly"],tips:["Slight bend in elbows","Don't swing — light and controlled"]},
      {name:"Face Pulls",sets:3,reps:15,cal:6,muscle:"Rear Delts, Rotator Cuff",bodyPart:"shoulders",difficulty:1,anim:"push",
        steps:["Cable at face height, rope attachment","Pull toward face, elbows high","Squeeze shoulder blades, return"],tips:["Best exercise for shoulder health","Do these every session"]},
    ],
    arms: [
      {name:"Barbell Curls",sets:3,reps:12,cal:6,muscle:"Biceps",bodyPart:"arms",difficulty:1,anim:"push",
        steps:["Grip bar underhand, shoulder-width","Curl bar to shoulders","Lower with control"],tips:["Don't swing body","Full range of motion"]},
      {name:"Tricep Pushdowns",sets:3,reps:12,cal:6,muscle:"Triceps",bodyPart:"arms",difficulty:1,anim:"push",
        steps:["Cable with rope/bar attachment","Push down until arms straight","Control the return"],tips:["Keep elbows at sides","Squeeze at bottom"]},
      {name:"Hammer Curls",sets:3,reps:10,cal:6,muscle:"Biceps, Forearms",bodyPart:"arms",difficulty:1,anim:"push",
        steps:["Dumbbells at sides, neutral grip","Curl up keeping neutral grip","Lower slowly"],tips:["Great for forearm development","Alternate arms or together"]},
      {name:"Skull Crushers",sets:3,reps:10,cal:8,muscle:"Triceps",bodyPart:"arms",difficulty:2,anim:"push",
        steps:["Lie flat, arms straight with bar/dumbbells","Lower weight toward forehead","Extend back up"],tips:["Only forearms move","Keep elbows pointing up"]},
    ],
    legs: [
      {name:"Barbell Squats",sets:4,reps:10,cal:14,muscle:"Quads, Glutes, Core",bodyPart:"legs",difficulty:2,anim:"squat",
        steps:["Bar on upper back, feet shoulder-width","Squat until thighs parallel","Drive up through heels"],tips:["Chest up, brace core","The king of all exercises"]},
      {name:"Leg Press",sets:4,reps:12,cal:12,muscle:"Quads, Glutes",bodyPart:"legs",difficulty:1,anim:"squat",
        steps:["Feet shoulder-width on platform","Lower until 90° knee bend","Press back up — don't lock out"],tips:["Feet higher = more glute","Don't go too deep"]},
      {name:"Romanian Deadlift",sets:3,reps:10,cal:12,muscle:"Hamstrings, Glutes, Lower Back",bodyPart:"legs",difficulty:2,anim:"squat",
        steps:["Hold barbell, slight knee bend","Hinge at hips, lower bar along legs","Squeeze hamstrings/glutes to return"],tips:["Feel the hamstring stretch","Bar stays close to legs"]},
      {name:"Leg Extensions",sets:3,reps:12,cal:8,muscle:"Quads",bodyPart:"legs",difficulty:1,anim:"squat",
        steps:["Sit in machine, pad on shins","Extend legs until straight","Lower with control"],tips:["Pause at top, squeeze quads","Don't use momentum"]},
      {name:"Leg Curls",sets:3,reps:12,cal:8,muscle:"Hamstrings",bodyPart:"legs",difficulty:1,anim:"squat",
        steps:["Lie or sit in machine","Curl legs toward glutes","Control the return"],tips:["Squeeze hamstrings at top","Full range of motion"]},
    ],
    core: [
      {name:"Cable Crunches",sets:3,reps:15,cal:8,muscle:"Abs",bodyPart:"core",difficulty:1,anim:"push",
        steps:["Kneel at cable, rope behind head","Crunch down, curling ribcage to hips","Return with control"],tips:["Focus on abs, not arms pulling","Exhale hard at contraction"]},
      {name:"Hanging Leg Raises",sets:3,reps:10,cal:10,muscle:"Lower Abs, Hip Flexors",bodyPart:"core",difficulty:2,anim:"plank",
        steps:["Hang from bar, arms straight","Raise legs to 90° or higher","Lower slowly"],tips:["No swinging","Tuck knees if straight is too hard"]},
      {name:"Ab Wheel Rollouts",sets:3,reps:8,cal:10,muscle:"Full Core",bodyPart:"core",difficulty:3,anim:"plank",
        steps:["Kneel with wheel on ground","Roll forward, extending body","Pull back using core"],tips:["Don't go too far at first","Keep core braced throughout"]},
    ],
    glutes: [
      {name:"Barbell Hip Thrusts",sets:4,reps:12,cal:12,muscle:"Glutes",bodyPart:"glutes",difficulty:2,anim:"push",
        steps:["Upper back on bench, bar on hips","Drive hips up, squeeze glutes hard","Lower with control"],tips:["Hold 2 sec at top","The #1 glute builder"]},
      {name:"Cable Kickbacks",sets:3,reps:12,cal:8,muscle:"Glutes",bodyPart:"glutes",difficulty:1,anim:"kick",
        steps:["Ankle cuff on cable, face machine","Kick leg straight back","Squeeze glute, return slowly"],tips:["Don't arch back","Light weight, mind-muscle connection"]},
      {name:"Sumo Deadlift",sets:3,reps:10,cal:14,muscle:"Glutes, Inner Thighs, Hamstrings",bodyPart:"glutes",difficulty:2,anim:"squat",
        steps:["Wide stance, toes out, grip bar narrow","Drive up through hips","Hinge back down"],tips:["Push knees out","Great glute and adductor builder"]},
    ],
    cardio: [
      {name:"Treadmill Sprints",sets:6,reps:30,cal:15,muscle:"Full Body Cardio",bodyPart:"cardio",difficulty:2,anim:"burpee",timed:true,
        steps:["Sprint at high speed for 30 seconds","Jump to sides, rest 30 seconds","Repeat 6 rounds"],tips:["Warm up first","Go truly all-out"]},
      {name:"Rowing Machine",sets:3,reps:60,cal:12,muscle:"Full Body, Back",bodyPart:"cardio",difficulty:1,anim:"push",timed:true,
        steps:["Drive with legs first","Pull handle to lower chest","Return arms, then legs"],tips:["It's a LEG exercise, not arms","Smooth rhythm"]},
      {name:"Battle Ropes",sets:3,reps:30,cal:12,muscle:"Arms, Shoulders, Core",bodyPart:"cardio",difficulty:2,anim:"punch",timed:true,
        steps:["Hold rope ends, slight squat","Alternate arm waves rapidly","30 seconds per set"],tips:["Create waves to the end","Stay low"]},
    ],
  },
};

export const FIGHTING = {
  boxing: [
    {name:"Jab",sets:3,reps:30,cal:8,anim:"punch",difficulty:1,
      steps:["Lead hand straight forward, rotate fist","Snap back to guard immediately","Keep rear hand protecting chin"],tips:["Speed over power","Step forward slightly for reach"]},
    {name:"Cross",sets:3,reps:30,cal:8,anim:"punch",difficulty:1,
      steps:["Rotate hips and rear foot","Drive rear hand straight forward","Pull back to guard"],tips:["Power from hips, not arm","Pivot rear foot"]},
    {name:"Jab-Cross Combo",sets:5,reps:20,cal:14,anim:"punch",difficulty:1,
      steps:["Quick jab, immediate cross","Full hip rotation on cross","Return to guard"],tips:["One fluid motion","Double the speed"]},
    {name:"Hook Punch",sets:3,reps:20,cal:10,anim:"punch",difficulty:2,
      steps:["Elbow bent at 90°, rotate hips","Swing arm in horizontal arc at chin level","Pull back to guard"],tips:["Short, tight hook","Power from hip rotation"]},
    {name:"Uppercut",sets:3,reps:20,cal:10,anim:"punch",difficulty:2,
      steps:["Drop rear hand slightly","Drive fist upward to chin level","Rotate hips into the punch"],tips:["Close range weapon","Don't wind up"]},
    {name:"4-Punch Combo",sets:5,reps:15,cal:18,anim:"punch",difficulty:2,
      steps:["Jab → Cross → Hook → Cross","Each flows into the next","Full rotation every punch"],tips:["THE fundamental combo","Speed first, power later"]},
    {name:"Slip & Counter",sets:3,reps:30,cal:12,anim:"punch",difficulty:2,timed:true,
      steps:["Visualize incoming jab","Slip head to outside","Counter with cross"],tips:["Slip with legs, not neck","Foundation of counter-fighting"]},
    {name:"Shadow Boxing",sets:3,reps:180,cal:25,anim:"punch",difficulty:1,timed:true,
      steps:["Move in stance, throw combos freely","Mix all punches","Focus on footwork between combos"],tips:["Visualize an opponent","Stay relaxed, breathe"]},
  ],
  kickboxing: [
    {name:"Front Kick (Teep)",sets:3,reps:15,cal:10,anim:"kick",difficulty:1,
      steps:["Lift knee to waist","Extend leg, push with ball of foot","Retract quickly"],tips:["Defensive kick for distance","Push through target"]},
    {name:"Roundhouse Kick",sets:3,reps:12,cal:14,anim:"kick",difficulty:2,
      steps:["Pivot support foot 90-180°","Whip shin through target horizontally","Retract and return to stance"],tips:["Pivot is everything","Drive hip through"]},
    {name:"Knee Strikes",sets:3,reps:15,cal:14,anim:"kick",difficulty:1,
      steps:["Clinch position, hands up","Drive knee upward to midsection","Rise on support foot for height"],tips:["Pull opponent onto knee","Hip thrust generates power"]},
    {name:"Kick-Punch Combos",sets:4,reps:10,cal:16,anim:"kick",difficulty:2,
      steps:["Jab-Cross → Roundhouse kick","Reset stance after kick","Alternate sides"],tips:["Transition smoothly","Don't telegraph the kick"]},
    {name:"Low Kick",sets:3,reps:12,cal:10,anim:"kick",difficulty:1,
      steps:["Target opponent's thigh","Swing shin like a baseball bat","Follow through"],tips:["Step to outside angle first","Hit with lower shin"]},
    {name:"Elbow Strikes",sets:3,reps:12,cal:10,anim:"punch",difficulty:2,
      steps:["Horizontal: swing elbow across","Upward: drive elbow up from below","Downward: drop elbow onto target"],tips:["Elbows are sharpest weapon","Very close range"]},
  ],
  mma: [
    {name:"Sprawl Drill",sets:3,reps:10,cal:12,anim:"burpee",difficulty:2,
      steps:["From stance, drop hips back fast","Spread legs wide, chest on imaginary opponent","Pop back up to stance"],tips:["Speed is everything","This defends takedowns"]},
    {name:"Ground & Pound Simulation",sets:3,reps:30,cal:14,anim:"punch",difficulty:2,timed:true,
      steps:["Mount position on ground","Throw controlled punches downward","Maintain position and posture"],tips:["Keep base wide","Alternate hands"]},
    {name:"Clinch Knees + Elbows",sets:3,reps:12,cal:14,anim:"kick",difficulty:2,
      steps:["Clinch position","Alternate knee strikes and elbows","Maintain clinch control"],tips:["Dirty boxing fundamentals","Control the head"]},
    {name:"Level Change Drill",sets:3,reps:15,cal:10,anim:"squat",difficulty:1,
      steps:["From stance, drop level quickly","Touch knee to ground","Explode back up"],tips:["Used for takedown setups","Keep hands up while level changing"]},
    {name:"MMA Shadow Fighting",sets:3,reps:180,cal:25,anim:"punch",difficulty:2,timed:true,
      steps:["Mix punches, kicks, knees, elbows","Add sprawls and level changes","Constant movement"],tips:["Fight simulation","Stay creative"]},
  ],
  martial_arts: [
    {name:"Horse Stance Hold",sets:3,reps:45,cal:6,anim:"squat",difficulty:1,timed:true,
      steps:["Wide stance, thighs parallel","Arms extended or at sides","Hold the position"],tips:["Foundation of all martial arts","Build tremendous leg endurance"]},
    {name:"Front Snap Kick",sets:3,reps:15,cal:8,anim:"kick",difficulty:1,
      steps:["Chamber knee high","Snap foot forward, ball of foot strikes","Retract immediately"],tips:["Speed, not power","Chamber high for deception"]},
    {name:"Side Kick",sets:3,reps:12,cal:10,anim:"kick",difficulty:2,
      steps:["Chamber knee across body","Thrust heel sideways at target","Keep body alignment"],tips:["Most powerful kick in martial arts","Hit with heel, not flat foot"]},
    {name:"Spinning Back Kick",sets:3,reps:8,cal:14,anim:"kick",difficulty:3,
      steps:["Pivot on front foot, spin 180°","Thrust rear heel backward at target","Spot your target through the spin"],tips:["Devastating power when landed","Practice spin slowly first"]},
    {name:"Kata / Forms Practice",sets:2,reps:300,cal:15,anim:"plank",difficulty:2,timed:true,
      steps:["Perform every technique in slow motion","Each movement 5-10 seconds","Focus on perfect form"],tips:["Moving meditation","Precision over speed"]},
  ],
};

// Warm-up exercises (always included)
export const WARMUP = [
  {name:"Arm Circles",sets:1,reps:20,cal:2,anim:"push",steps:["Large circles forward, then backward"],tips:["Loosen shoulders"]},
  {name:"Leg Swings",sets:1,reps:15,cal:2,anim:"kick",steps:["Forward/back, then side to side"],tips:["Hold wall for balance"]},
  {name:"Jumping Jacks",sets:1,reps:20,cal:3,anim:"burpee",steps:["Classic jumping jacks to raise heart rate"],tips:["Light and bouncy"]},
  {name:"Hip Circles",sets:1,reps:10,cal:2,anim:"squat",steps:["Hands on hips, large circles both directions"],tips:["Open up the hips"]},
  {name:"High Knees",sets:1,reps:20,cal:3,anim:"burpee",steps:["Run in place, knees to waist height"],tips:["Increase pace gradually"]},
];

export const COOLDOWN = [
  {name:"Standing Forward Fold",sets:1,reps:30,cal:1,anim:"plank",timed:true,steps:["Bend forward, let arms hang, hold"],tips:["Let gravity stretch you"]},
  {name:"Quad Stretch",sets:1,reps:30,cal:1,anim:"squat",timed:true,steps:["Pull heel to glute, hold each leg 30s"],tips:["Hold wall for balance"]},
  {name:"Child's Pose",sets:1,reps:30,cal:1,anim:"plank",timed:true,steps:["Kneel, sit back on heels, arms forward"],tips:["Breathe deeply, relax"]},
  {name:"Deep Breathing",sets:1,reps:60,cal:1,anim:"plank",timed:true,steps:["4 count inhale, 4 count hold, 4 count exhale"],tips:["Calm the nervous system"]},
];


// ── RUNNING PROGRAMS ──
export const RUNNING = {
  easy: [
    {name:"Easy Jog",sets:1,reps:1200,cal:120,muscle:"Cardio, Legs",bodyPart:"cardio",difficulty:1,anim:"run",timed:true,
      steps:["Maintain conversational pace","Breathe rhythmically — in through nose, out through mouth","Land midfoot, not on heels","Keep shoulders relaxed, arms at 90°"],tips:["If you can't talk, slow down","This builds your aerobic base"]},
    {name:"Walk-Run Intervals",sets:6,reps:120,cal:80,muscle:"Cardio, Endurance",bodyPart:"cardio",difficulty:1,anim:"run",timed:true,
      steps:["Run 2 minutes at comfortable pace","Walk 1 minute to recover","Repeat 6 rounds","Total: 18 minutes"],tips:["Perfect for beginners","Gradually increase run time"]},
  ],
  moderate: [
    {name:"Tempo Run",sets:1,reps:1500,cal:180,muscle:"Cardio, Stamina",bodyPart:"cardio",difficulty:2,anim:"run",timed:true,
      steps:["5 min warm-up jog","15 min at 'comfortably hard' pace","5 min cool-down jog","You should be able to say short phrases but not chat"],tips:["This is your race pace training","Push but don't sprint"]},
    {name:"Sprint Intervals",sets:8,reps:30,cal:150,muscle:"Speed, Power",bodyPart:"legs",difficulty:2,anim:"run",timed:true,
      steps:["Sprint all-out for 30 seconds","Walk/jog 60 seconds to recover","Repeat 8 rounds","Warm up with 5 min jog first"],tips:["True sprints = maximum effort","Walk recovery, don't stand still"]},
    {name:"Hill Sprints",sets:6,reps:30,cal:130,muscle:"Power, Glutes, Calves",bodyPart:"legs",difficulty:2,anim:"run",timed:true,
      steps:["Find a hill or incline","Sprint up for 30 seconds","Walk back down to recover","Repeat 6 times"],tips:["Lean slightly forward uphill","Pump arms hard"]},
  ],
  advanced: [
    {name:"Long Run",sets:1,reps:2400,cal:300,muscle:"Endurance, Mental",bodyPart:"cardio",difficulty:3,anim:"run",timed:true,
      steps:["Run at easy pace for 40 minutes","Stay relaxed and consistent","Hydrate before and during if needed","This builds mental toughness"],tips:["Slow down if breathing gets hard","The last 10 min is where you grow"]},
    {name:"Fartlek Run",sets:1,reps:1800,cal:200,muscle:"Speed Endurance",bodyPart:"cardio",difficulty:2,anim:"run",timed:true,
      steps:["30 min total: alternate fast and slow","Sprint to a landmark, jog to the next","No set pattern — play with speed","Mix of speed and recovery"],tips:["Swedish for 'speed play'","Makes running fun and varied"]},
  ],
};

// ── YOGA / FLEXIBILITY ──
export const YOGA = [
  {name:"Sun Salutation (Surya Namaskar)",sets:3,reps:1,cal:8,muscle:"Full Body, Flexibility",bodyPart:"full",difficulty:1,anim:"yoga",
    steps:["Mountain pose → Forward fold → Halfway lift","Step back to plank → Lower to floor","Cobra → Downward dog → Step forward","Halfway lift → Forward fold → Mountain"],tips:["One breath per movement","Flow smoothly between poses"]},
  {name:"Warrior I",sets:1,reps:30,cal:3,muscle:"Legs, Core, Balance",bodyPart:"legs",difficulty:1,anim:"yoga",timed:true,
    steps:["Lunge position, rear foot at 45°","Arms overhead, hips square forward","Hold and breathe deeply","Switch sides"],tips:["Press rear heel into ground","Sink deeper into the front knee"]},
  {name:"Warrior II",sets:1,reps:30,cal:3,muscle:"Legs, Arms, Core",bodyPart:"legs",difficulty:1,anim:"yoga",timed:true,
    steps:["Wide stance, front foot forward, back foot sideways","Arms extended parallel to ground","Gaze over front fingertips","Hold each side 30 seconds"],tips:["Keep front knee over ankle","Strong arms, relaxed shoulders"]},
  {name:"Downward Dog",sets:1,reps:45,cal:3,muscle:"Shoulders, Hamstrings, Back",bodyPart:"back",difficulty:1,anim:"yoga",timed:true,
    steps:["Hands and feet on ground, hips high","Press chest toward thighs","Heels reaching toward ground","Spread fingers wide, press through palms"],tips:["Bend knees if hamstrings are tight","Create length in the spine"]},
  {name:"Pigeon Pose",sets:1,reps:60,cal:2,muscle:"Hips, Glutes",bodyPart:"glutes",difficulty:1,anim:"yoga",timed:true,
    steps:["From downward dog, bring right knee forward","Right shin across the mat","Extend left leg straight back","Fold forward over front leg"],tips:["Best hip opener in yoga","Hold 60 seconds each side"]},
  {name:"Tree Pose",sets:1,reps:30,cal:2,muscle:"Balance, Core, Ankles",bodyPart:"core",difficulty:1,anim:"yoga",timed:true,
    steps:["Stand on one leg","Place other foot on inner thigh or calf","Hands at heart or overhead","Find a fixed point to gaze at"],tips:["Never place foot on knee","Start with foot on calf if needed"]},
  {name:"Bridge Pose",sets:3,reps:20,cal:4,muscle:"Glutes, Back, Core",bodyPart:"glutes",difficulty:1,anim:"yoga",timed:true,
    steps:["Lie on back, knees bent, feet flat","Lift hips toward ceiling","Squeeze glutes at top","Lower slowly"],tips:["Press through heels","Keep knees hip-width apart"]},
  {name:"Cobra Stretch",sets:1,reps:30,cal:2,muscle:"Back, Chest",bodyPart:"back",difficulty:1,anim:"yoga",timed:true,
    steps:["Lie face down, hands under shoulders","Press up, lifting chest","Keep hips on ground","Look slightly upward"],tips:["Don't push too high at first","Feel the stretch in your abs"]},
];

// ── HIIT WORKOUTS ──
export const HIIT = [
  {name:"Tabata Burpees",sets:8,reps:20,cal:15,muscle:"Full Body",bodyPart:"cardio",difficulty:2,anim:"hiit",timed:true,
    steps:["20 seconds all-out burpees","10 seconds rest","Repeat 8 rounds","Total: 4 minutes of hell"],tips:["Go MAXIMUM effort each round","10 sec rest is sacred — use it"]},
  {name:"Jump Squat + Push-up Combo",sets:5,reps:30,cal:12,muscle:"Legs, Chest, Cardio",bodyPart:"cardio",difficulty:2,anim:"hiit",timed:true,
    steps:["30 sec: Alternate jump squats and push-ups","30 sec rest","Repeat 5 rounds","No pausing during work intervals"],tips:["Quality reps > speed","Transition quickly between exercises"]},
  {name:"Mountain Climber Blitz",sets:4,reps:30,cal:10,muscle:"Core, Shoulders, Cardio",bodyPart:"core",difficulty:1,anim:"hiit",timed:true,
    steps:["30 seconds mountain climbers at max speed","30 seconds rest","Repeat 4 rounds","Keep hips level"],tips:["Drive knees to chest aggressively","Arms locked, core engaged"]},
  {name:"EMOM (Every Minute on the Minute)",sets:10,reps:60,cal:12,muscle:"Full Body",bodyPart:"cardio",difficulty:2,anim:"hiit",timed:true,
    steps:["Minute 1: 10 burpees, rest remaining time","Minute 2: 15 squats, rest remaining time","Minute 3: 10 push-ups, rest remaining time","Repeat for 10 minutes"],tips:["Finish reps fast = more rest","Classic CrossFit format"]},
  {name:"Ladder Drill",sets:1,reps:600,cal:50,muscle:"Full Body, Mental",bodyPart:"cardio",difficulty:2,anim:"hiit",timed:true,
    steps:["Round 1: 1 burpee, 1 squat, 1 push-up","Round 2: 2 of each","Round 3: 3 of each","Go up to 10, then back down to 1"],tips:["This is a mental challenge","By round 7-8 you'll want to quit. Don't."]},
];

// ── WORKOUT GENERATOR ──
const SPLIT_ROTATION = {
  0: ["chest", "shoulders", "arms"],       // Sunday: Push
  1: ["back", "arms"],                     // Monday: Pull
  2: ["legs", "glutes"],                   // Tuesday: Legs
  3: ["core", "cardio"],                   // Wednesday: Core + Cardio
  4: ["chest", "back", "shoulders"],       // Thursday: Upper
  5: ["legs", "glutes", "core"],           // Friday: Lower + Core
  6: ["cardio"],                           // Saturday: Active Recovery
};

const SPLIT_NAMES = {
  0: "Push Day — Chest, Shoulders & Arms",
  1: "Pull Day — Back & Arms",
  2: "Leg Day — Quads, Hamstrings & Glutes",
  3: "Core & Cardio",
  4: "Upper Body Power",
  5: "Lower Body & Core",
  6: "Active Recovery & Cardio",
};

// Activity type mapping for daily configurator
export const ACTIVITY_TYPES = [
  { id: "bodyweight", label: "Bodyweight", icon: "🤸", desc: "No equipment needed" },
  { id: "gym", label: "Gym", icon: "🏋️", desc: "Weights & machines" },
  { id: "running", label: "Running", icon: "🏃", desc: "Cardio & endurance" },
  { id: "boxing", label: "Boxing", icon: "🥊", desc: "Punches & footwork" },
  { id: "kickboxing", label: "Kickboxing", icon: "🦵", desc: "Strikes & kicks" },
  { id: "mma", label: "MMA", icon: "⚔️", desc: "Mixed martial arts" },
  { id: "martial_arts", label: "Martial Arts", icon: "🥋", desc: "Traditional techniques" },
  { id: "yoga", label: "Yoga", icon: "🧘", desc: "Flexibility & balance" },
  { id: "hiit", label: "HIIT", icon: "⚡", desc: "High intensity intervals" },
];

export const BODY_PARTS = [
  { id: "chest", label: "Chest", icon: "🫁" },
  { id: "back", label: "Back", icon: "🔙" },
  { id: "shoulders", label: "Shoulders", icon: "💪" },
  { id: "arms", label: "Arms", icon: "🦾" },
  { id: "core", label: "Core", icon: "🔥" },
  { id: "legs", label: "Legs", icon: "🦵" },
  { id: "glutes", label: "Glutes", icon: "🍑" },
  { id: "full", label: "Full Body", icon: "⚡" },
];

export const TIME_OPTIONS = [15, 30, 45, 60, 90];

export function generateWorkout(profile, dailyConfig = null) {
  const dayOfWeek = new Date().getDay();
  const equipment = profile.trainingType || "bodyweight";
  const level = profile.fitnessLevel || "intermediate";
  const time = parseInt(profile.dailyTime) || 45;
  const fighting = profile.fightingStyle || "none";
  const focusAreas = profile.focusAreas || ["full"];
  const goal = profile.goal || "fit";

  // Determine today's body parts
  let todayParts = SPLIT_ROTATION[dayOfWeek];
  
  // If user has specific focus areas (not "full"), prioritize those
  if (!focusAreas.includes("full")) {
    // Mix user focus with today's split
    const userParts = focusAreas.filter(p => p !== "full");
    todayParts = [...new Set([...todayParts.filter(p => userParts.includes(p)), ...userParts.slice(0, 2)])].slice(0, 3);
    if (todayParts.length === 0) todayParts = SPLIT_ROTATION[dayOfWeek];
  }

  const splitName = focusAreas.includes("full") ? SPLIT_NAMES[dayOfWeek] : 
    todayParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(", ") + " Focus";

  // Determine exercise source
  const eqKey = (equipment === "gym" || equipment === "mixed") ? "gym" : "bodyweight";
  const altKey = equipment === "mixed" ? "bodyweight" : null;

  // Calculate exercise counts based on time
  // ~3 min per exercise including rest, warm-up=5min, cooldown=3min, fighting=10min
  const fightTime = fighting !== "none" ? 10 : 0;
  const exerciseTime = time - 8 - fightTime; // subtract warmup, cooldown, fight
  const maxExercises = Math.max(3, Math.floor(exerciseTime / 3));

  // Difficulty filter
  const maxDifficulty = level === "beginner" ? 1 : level === "advanced" ? 3 : 2;

  // Pick exercises for each body part
  let selectedExercises = [];
  const exercisesPerPart = Math.max(2, Math.floor(maxExercises / todayParts.length));

  todayParts.forEach(part => {
    let pool = (EXERCISES[eqKey]?.[part] || []).filter(e => e.difficulty <= maxDifficulty);
    if (altKey && pool.length < exercisesPerPart) {
      pool = [...pool, ...(EXERCISES[altKey]?.[part] || []).filter(e => e.difficulty <= maxDifficulty)];
    }
    if (pool.length === 0) pool = (EXERCISES.bodyweight[part] || []).filter(e => e.difficulty <= maxDifficulty);
    
    // Shuffle and pick
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    selectedExercises.push(...shuffled.slice(0, exercisesPerPart));
  });

  // Add cardio if goal is fat loss
  if (goal === "lose" && !todayParts.includes("cardio")) {
    const cardioPool = (EXERCISES[eqKey]?.cardio || EXERCISES.bodyweight.cardio).filter(e => e.difficulty <= maxDifficulty);
    if (cardioPool.length > 0) {
      selectedExercises.push(cardioPool[Math.floor(Math.random() * cardioPool.length)]);
    }
  }

  // Trim to max
  selectedExercises = selectedExercises.slice(0, maxExercises);

  // Scale sets/reps based on level
  const levelScale = level === "beginner" ? 0.7 : level === "advanced" ? 1.3 : 1;
  selectedExercises = selectedExercises.map(e => ({
    ...e,
    sets: Math.max(2, Math.round(e.sets * levelScale)),
    reps: Math.round(e.reps * levelScale),
    category: "strength",
  }));

  // Pick fighting exercises
  let fightingExercises = [];
  if (fighting !== "none" && FIGHTING[fighting]) {
    const fightPool = FIGHTING[fighting].filter(e => e.difficulty <= maxDifficulty);
    const shuffled = [...fightPool].sort(() => Math.random() - 0.5);
    const fightCount = Math.max(2, Math.floor(fightTime / 3));
    fightingExercises = shuffled.slice(0, fightCount).map(e => ({
      ...e,
      sets: Math.max(2, Math.round(e.sets * levelScale)),
      reps: Math.round(e.reps * levelScale),
      category: "combat",
    }));
  }

  // Estimate total time and calories
  const totalExercises = selectedExercises.length + fightingExercises.length;
  const estTime = 8 + (totalExercises * 3); // rough estimate
  const estCal = [...selectedExercises, ...fightingExercises].reduce((s, e) => s + (e.cal * e.sets), 0);

  return {
    splitName,
    bodyParts: todayParts,
    exercises: selectedExercises,
    fighting: fightingExercises,
    warmup: WARMUP,
    cooldown: COOLDOWN,
    estTime,
    estCal,
    equipment: eqKey,
    level,
    dayOfWeek,
  };
}
