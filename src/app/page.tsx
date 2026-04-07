import { LocationHeader } from "@/components/LocationHeader";
import { ScheduleList } from "@/components/ScheduleList";
import { Banner } from "@/components/Banner";
import { SubscribeForm } from "@/components/SubscribeForm";

export default function HomePage() {
  return (
    <>
      <Banner />
      <LocationHeader />
      <ScheduleList />
      <SubscribeForm />
    </>
  );
}
