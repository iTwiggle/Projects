import { applyTone, type ToneProfile } from "../tone/tone-framework";

export type HomeTaskViewModel = {
  selectedTaskText: string;
  activeTone: ToneProfile;
  renderedTaskText: string;
};

export function renderTaskForHomeScreen(
  selectedTaskText: string,
  activeTone: ToneProfile
): HomeTaskViewModel {
  return {
    selectedTaskText,
    activeTone,
    // Task selection remains untouched; we only transform rendered copy.
    renderedTaskText: applyTone(selectedTaskText, activeTone)
  };
}
