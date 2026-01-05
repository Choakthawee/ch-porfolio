import ClickSpark from "@/components/click-spark/ClickSpark";
import Particles from "@/components/particle-bg/Particles";
import ScrambledText from "@/components/scrambled-text/ScrambledText";
import Shuffle from "@/components/shuffle-text/ShuffleText";

export default function Home() {
  return (
    <ClickSpark
      sparkColor='#fff'
      sparkSize={10}
      sparkRadius={15}
      sparkCount={8}
      duration={400}>

      <div className="relative w-full h-screen bg-black">

        <div className="absolute inset-0 z-0">
          <Particles
            particleColors={['#ffffff', '#ffffff']}
            particleCount={200}
            particleSpread={10}
            speed={0.1}
            particleBaseSize={100}
            moveParticlesOnHover={true}
            alphaParticles={false}
            disableRotation={false}
          />
        </div>

        <div className="flex flex-col z-10 items-center justify-center h-full w-full px-4 gap-0">

          <ScrambledText
            className="text-white text-center text-4xl md:text-6xl font-bold font-mono tracking-wider"
            radius={100}
            duration={1.2}
            speed={0.5}
            scrambleChars=".:"
          >
            PORTFOLIO
          </ScrambledText>

          <Shuffle
            className="text-gray-300 text-center text-lg md:text-2xl font-mono"
            duration={0.65}
            shuffleTimes={2}
            loop={true}
            loopDelay={1.5}
            text="Presented By Choakthawee Nikhomkhai"
          />

        </div>
      </div>
    </ClickSpark>
  );
}