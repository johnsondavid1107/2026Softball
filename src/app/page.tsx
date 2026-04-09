import { LocationHeader } from "@/components/LocationHeader";
import { ScheduleList } from "@/components/ScheduleList";
import { Banner } from "@/components/Banner";
import { SubscribeForm } from "@/components/SubscribeForm";
import { NewGameToast } from "@/components/NewGameToast";

export default function HomePage() {
  return (
    <>
      <Banner />
      <LocationHeader />
      <NewGameToast />
      <ScheduleList />

      {/*
       * Fixed subscribe dock — sits at the bottom of the viewport.
       * The schedule scrolls freely behind it (ScheduleList has pb-72 clearance).
       * Gradient above the card softens the scroll-behind effect.
       */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
        <div className="mx-auto max-w-[480px] pointer-events-auto">
          {/* Fade gradient so content doesn't hard-cut behind the card */}
          <div className="h-10 bg-gradient-to-t from-team-cream to-transparent" />
          <div className="px-4 pb-4 safe-bottom bg-team-cream">
            <SubscribeForm />
          </div>
        </div>
      </div>
    </>
  );
}
