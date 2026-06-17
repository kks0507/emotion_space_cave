import CaveExperience from "@/components/CaveExperience";
import { getAudience, toAudienceView } from "@/lib/audience";

export const metadata = { title: "마음동굴" };

export default function AdultPage() {
  const audience = toAudienceView(getAudience("adult"));
  return <CaveExperience audience={audience} />;
}
