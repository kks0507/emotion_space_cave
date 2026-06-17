import CaveExperience from "@/components/CaveExperience";
import { getAudience, toAudienceView } from "@/lib/audience";

export const metadata = { title: "마음동굴 어린이" };

export default function ChildPage() {
  const audience = toAudienceView(getAudience("child"));
  return <CaveExperience audience={audience} />;
}
