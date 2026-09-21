import { Stage } from '@/components/3d/Stage';
import { Providers } from '@/components/Providers';
import { ConfiguratorSection } from '@/components/sections/ConfiguratorSection';
import { CTASection } from '@/components/sections/CTASection';
import { DesignSection } from '@/components/sections/DesignSection';
import { MachineSection } from '@/components/sections/MachineSection';
import { EngineeringSection } from '@/components/sections/EngineeringSection';
import { EnvironmentSection } from '@/components/sections/EnvironmentSection';
import { MaterialsSection } from '@/components/sections/MaterialsSection';
import { PerformanceSection } from '@/components/sections/PerformanceSection';
import { StudySection } from '@/components/sections/StudySection';
import { Navigation } from '@/components/ui/Navigation';
import { Initializer } from '@/components/ui/Initializer';
import { Overlays } from '@/components/ui/Overlays';

export default function Home() {
  return (
    <Providers>
      <Initializer />
      <Stage />
      <Overlays />
      <Navigation />
      <main className="page">
        <MachineSection />
        <DesignSection />
        <StudySection />
        <PerformanceSection />
        <EngineeringSection />
        <MaterialsSection />
        <EnvironmentSection />
        <ConfiguratorSection />
        <CTASection />
      </main>
    </Providers>
  );
}
