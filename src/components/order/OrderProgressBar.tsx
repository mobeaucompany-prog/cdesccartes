import { Check, Clock, ChefHat, Package } from 'lucide-react';

interface OrderProgressBarProps {
  status: 'pending' | 'accepted' | 'rejected' | 'ready';
}

const steps = [
  { key: 'pending', label: 'En attente', icon: Clock },
  { key: 'accepted', label: 'En préparation', icon: ChefHat },
  { key: 'ready', label: 'Prête !', icon: Package },
];

const OrderProgressBar = ({ status }: OrderProgressBarProps) => {
  const getStepStatus = (stepKey: string) => {
    if (status === 'rejected') return 'inactive';
    
    const statusOrder = ['pending', 'accepted', 'ready'];
    const currentIndex = statusOrder.indexOf(status);
    const stepIndex = statusOrder.indexOf(stepKey);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'inactive';
  };

  if (status === 'rejected') {
    return (
      <div className="bg-destructive/10 rounded-2xl p-6 text-center">
        <div className="w-16 h-16 bg-destructive rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-3xl">✕</span>
        </div>
        <p className="text-destructive font-semibold">Commande refusée</p>
        <p className="text-sm text-muted-foreground mt-1">
          Désolé, le restaurant n'a pas pu accepter votre commande.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card">
      <div className="flex items-center justify-between relative">
        {/* Progress Line Background */}
        <div className="absolute top-6 left-8 right-8 h-1 bg-secondary rounded-full" />
        
        {/* Progress Line Active */}
        <div 
          className="absolute top-6 left-8 h-1 bg-gradient-hero rounded-full transition-all duration-700"
          style={{
            width: status === 'pending' ? '0%' : 
                   status === 'accepted' ? 'calc(50% - 16px)' : 
                   'calc(100% - 64px)'
          }}
        />
        
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step.key);
          const StepIcon = step.icon;
          
          return (
            <div 
              key={step.key}
              className="relative z-10 flex flex-col items-center"
            >
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                  stepStatus === 'completed' 
                    ? 'bg-success text-success-foreground' 
                    : stepStatus === 'active'
                    ? 'bg-gradient-hero text-white shadow-hero animate-pulse'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {stepStatus === 'completed' ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <StepIcon className={`w-6 h-6 ${stepStatus === 'active' ? 'animate-bounce' : ''}`} />
                )}
              </div>
              <span 
                className={`mt-3 text-sm font-medium text-center ${
                  stepStatus === 'active' ? 'text-primary' : 
                  stepStatus === 'completed' ? 'text-success' : 
                  'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderProgressBar;
