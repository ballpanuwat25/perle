import { Hero } from "@/components/Hero";
import { Dive } from "@/components/Dive";
import { Ladder } from "@/components/Ladder";
import { NotSay } from "@/components/NotSay";
import { Finder } from "@/components/Finder";
import { Buy } from "@/components/Buy";
import { Footer } from "@/components/Footer";
import { Scene } from "@/components/Scene";

export default function Home() {
  return (
    <>
      <main>
        {/* the hero holds still while the dive section rises over it */}
        <div className="sink">
          <Hero />
          <Dive />
        </div>
        <Ladder />
        <NotSay />
        <Finder />
        <Buy />
      </main>
      <Footer />
      <Scene />
    </>
  );
}
