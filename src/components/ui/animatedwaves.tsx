import dynamic from "next/dynamic";

const AnimatedWaves = dynamic(() => import("../ui/backgroundpaths"), {
  ssr: false,
});
export default AnimatedWaves;

// Then use <AnimatedWaves /> instead of your current component
