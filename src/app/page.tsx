import { AppSection } from "@/components/marketing/app-section";
import { CommunitySection } from "@/components/marketing/community-section";
import { Features } from "@/components/marketing/features";
import { Footer } from "@/components/marketing/footer";
import { Header } from "@/components/marketing/header";
import { Hero } from "@/components/marketing/hero";
import { ServiceIntro } from "@/components/marketing/service-intro";

export default function Home() {
  return <main id="top"><a className="skip-link" href="#content">본문으로 건너뛰기</a><Header /><div id="content"><Hero /><ServiceIntro /><Features /><AppSection /><CommunitySection /></div><Footer /></main>;
}
