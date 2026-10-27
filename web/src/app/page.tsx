import { Hero } from "@/components/Hero";
import { Dive } from "@/components/Dive";
import { Buy } from "@/components/Buy";
import { Footer } from "@/components/Footer";
import { Scene } from "@/components/Scene";

export default function Home() {
  return (
    <>
      {/* the hero holds still while the dive section rises over it */}
      <div className="sink">
        <Hero />
        <Dive />
      </div>
      <Buy />
      <Footer />
      <Scene />
    </>
  );
}
