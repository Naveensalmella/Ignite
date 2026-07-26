export const WEEKLY_PLANS = {
  muscle: { name:"Muscle Building", splits:[
    {day:"Monday",focus:"chest",label:"Chest + Triceps",icon:"💪",muscles:["Chest","Triceps"]},
    {day:"Tuesday",focus:"back",label:"Back + Biceps",icon:"🏋️",muscles:["Back","Biceps"]},
    {day:"Wednesday",focus:"legs",label:"Legs + Glutes",icon:"🦵",muscles:["Quads","Hamstrings","Glutes"]},
    {day:"Thursday",focus:"rest",label:"Rest / Light Cardio",icon:"🧘",muscles:[]},
    {day:"Friday",focus:"shoulders",label:"Shoulders + Arms",icon:"🔱",muscles:["Shoulders","Biceps","Triceps"]},
    {day:"Saturday",focus:"full",label:"Full Body Power",icon:"⚡",muscles:["Full Body"]},
    {day:"Sunday",focus:"rest",label:"Rest & Recovery",icon:"😴",muscles:[]},
  ]},
  lose: { name:"Fat Loss", splits:[
    {day:"Monday",focus:"full",label:"HIIT + Full Body",icon:"🔥",muscles:["Full Body"]},
    {day:"Tuesday",focus:"chest",label:"Upper Body + Cardio",icon:"💪",muscles:["Chest","Back","Shoulders"]},
    {day:"Wednesday",focus:"legs",label:"Lower Body + HIIT",icon:"🦵",muscles:["Legs","Glutes"]},
    {day:"Thursday",focus:"rest",label:"Active Recovery",icon:"🚶",muscles:[]},
    {day:"Friday",focus:"full",label:"Full Body Circuit",icon:"⚡",muscles:["Full Body"]},
    {day:"Saturday",focus:"core",label:"Core + Cardio",icon:"🔥",muscles:["Core","Cardio"]},
    {day:"Sunday",focus:"rest",label:"Rest Day",icon:"😴",muscles:[]},
  ]},
  fit: { name:"General Fitness", splits:[
    {day:"Monday",focus:"chest",label:"Push Day",icon:"💪",muscles:["Chest","Shoulders","Triceps"]},
    {day:"Tuesday",focus:"back",label:"Pull Day",icon:"🏋️",muscles:["Back","Biceps"]},
    {day:"Wednesday",focus:"legs",label:"Leg Day",icon:"🦵",muscles:["Legs","Glutes"]},
    {day:"Thursday",focus:"rest",label:"Rest + Stretch",icon:"🧘",muscles:[]},
    {day:"Friday",focus:"full",label:"Full Body",icon:"⚡",muscles:["Full Body"]},
    {day:"Saturday",focus:"core",label:"Core + Cardio",icon:"🔥",muscles:["Core"]},
    {day:"Sunday",focus:"rest",label:"Rest Day",icon:"😴",muscles:[]},
  ]},
  boxing: { name:"Boxing Mastery", splits:[
    {day:"Monday",focus:"boxing",label:"Basics — Jab & Cross",icon:"🥊",muscles:["Shoulders","Core"]},
    {day:"Tuesday",focus:"full",label:"Strength + Conditioning",icon:"💪",muscles:["Full Body"]},
    {day:"Wednesday",focus:"boxing",label:"Hooks & Uppercuts",icon:"🥊",muscles:["Shoulders","Obliques"]},
    {day:"Thursday",focus:"rest",label:"Active Recovery",icon:"🧘",muscles:[]},
    {day:"Friday",focus:"boxing",label:"Combos & Defense",icon:"🥊",muscles:["Full Body"]},
    {day:"Saturday",focus:"legs",label:"Footwork + Legs",icon:"🦶",muscles:["Legs","Calves"]},
    {day:"Sunday",focus:"rest",label:"Rest Day",icon:"😴",muscles:[]},
  ]},
  mma: { name:"MMA Fighter", splits:[
    {day:"Monday",focus:"mma",label:"Striking Day",icon:"🥊",muscles:["Shoulders","Core"]},
    {day:"Tuesday",focus:"full",label:"Strength & Power",icon:"💪",muscles:["Full Body"]},
    {day:"Wednesday",focus:"mma",label:"Grappling & Ground",icon:"🤼",muscles:["Core","Back"]},
    {day:"Thursday",focus:"rest",label:"Recovery + Yoga",icon:"🧘",muscles:[]},
    {day:"Friday",focus:"mma",label:"Mixed Techniques",icon:"⚔️",muscles:["Full Body"]},
    {day:"Saturday",focus:"legs",label:"Conditioning",icon:"🔥",muscles:["Cardio","Legs"]},
    {day:"Sunday",focus:"rest",label:"Rest Day",icon:"😴",muscles:[]},
  ]},
};
export function getTodayPlan(goal,activity){
  const di=new Date().getDay();
  const dn=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][di];
  let pk="fit";
  if(["boxing","kickboxing"].includes(activity))pk="boxing";
  else if(["mma","martial_arts"].includes(activity))pk="mma";
  else if(goal==="muscle")pk="muscle";
  else if(goal==="lose")pk="lose";
  const plan=WEEKLY_PLANS[pk];
  return{plan,today:plan.splits.find(s=>s.day===dn),dayName:dn,planKey:pk};
}
