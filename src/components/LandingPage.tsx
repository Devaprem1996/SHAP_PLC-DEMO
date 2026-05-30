import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import techHero from "@/assets/plant-floor-hero.jpg";
const LandingPage = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-gradient-bg bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-plasma opacity-5 animate-plasma-rotate" />
      
      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in-up">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-primary glow-text leading-tight shadow-glow-primary">
                Real-time PLC Monitoring
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Visualize your production line with an advanced monitoring dashboard. Stay 
                on top of station errors and system health.
              </p>
            </div>
            
            <div className="flex gap-4">
              <Button variant="plasma" size="lg" onClick={() => navigate('/dashboard')} className="text-lg px-8 py-4 h-auto text-slate-950">
                Get Started
              </Button>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative animate-fade-in-up [animation-delay:0.2s]">
            <div className="relative rounded-2xl overflow-hidden border border-primary/20 shadow-glow-primary">
              <img src={techHero} alt="Modern industrial manufacturing plant floor with automated systems and PLC monitoring equipment" className="w-full h-auto object-cover" />
              
              {/* Glass Overlay */}
              {/* Minimal overlay for status indicators */}
              
              {/* Floating Status Indicators */}
              <div className="absolute top-4 right-4 flex gap-2">
                <div className="bg-accent/20 backdrop-blur-sm border border-accent/30 rounded-full px-3 py-1 text-sm text-accent animate-glow-pulse">
                  ● LIVE DATA
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/10 to-transparent" />
    </div>;
};
export default LandingPage;