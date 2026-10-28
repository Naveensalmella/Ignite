"use client";
import TrainingHome from './TrainingHome';

// Training tab — the whole flow (browse → workout → summary) lives in TrainingHome.
export default function TrainingPage({ addXP = () => { }, workoutLog = {}, setWorkoutLog = () => { }, profile = {}, programState = {}, setProgramState = () => { } }) {
  return (
    <TrainingHome
      workoutLog={workoutLog}
      setWorkoutLog={setWorkoutLog}
      addXP={addXP}
      profile={profile}
      programState={programState}
      setProgramState={setProgramState}
    />
  );
}
