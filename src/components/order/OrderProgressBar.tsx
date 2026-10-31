import { Check, Clock3, ChefHat, PackageCheck, X } from 'lucide-react';

interface OrderProgressBarProps {
  status: 'pending' | 'accepted' | 'rejected' | 'ready';
}

const steps = [
  { key: 'pending', label: 'Reçue', icon: Clock3 },
  { key: 'accepted', label: 'Préparation', icon: ChefHat },
  { key: 'ready', label: 'Prête', icon: PackageCheck },
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
      <div className="bg-card border border-destructive/20 rounded-3xl p-6 text-center shadow-sm">
        <div className="w-14 h-14 bg-destructive/10 text-destructive rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <X className="w-7 h-7" />
        </div>
        <p className="text-foreground font-bold text-lg">Commande refusée</p>
        <p className="text-sm text-muted-foreground mt-1">Le restaurant n'a pas pu accepter cette commande.</p>
      </div>
    );
  }

  const progressWidth = status === 'pending' ? '0%' : status === 'accepted' ? '50%' : '100%';

  return (
    <div className="bg-card rounded-3xl p-5 sm:p-6 border border-border/70 shadow-sm">
      <div className="relative flex items-start justify-between">
        <div className="absolute top-6 left-[12%] right-[12%] h-1 bg-secondary rounded-full overflow-hidden">
          <div className="h-full gradient-primary rounded-full transition-all duration-700" style={{ width: progressWidth }} />
        </div>

        {steps.map((step) => {
          const stepStatus = getStepStatus(step.key);
          const StepIcon = step.icon;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center w-1/3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-4 border-card ${
                  stepStatus === 'completed'
                    ? 'bg-success text-success-foreground'
                    : stepStatus === 'active'
                      ? 'gradient-primary text-primary-foreground shadow-md'
                      : 'bg-secondary text-muted-foreground'
                }`}
              >
                {stepStatus === 'completed' ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
              </div>
              <span
                className={`mt-2 text-xs sm:text-sm font-semibold text-center ${
                  stepStatus === 'active'
                    ? 'text-primary'
                    : stepStatus === 'completed'
                      ? 'text-success'
                      : 'text-muted-foreground'
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
