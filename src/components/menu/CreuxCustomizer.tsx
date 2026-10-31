import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import type { MenuItem } from '@/types/database';
import { breads, bases, recipes, creuxPrice, selection } from '@/lib/creux';

export default function CreuxCustomizer({item, menu, close}: {item: MenuItem; menu: MenuItem[]; close: () => void}) {
  const box = item.nom === 'Box étudiante';
  const {addItem} = useCart();
  const [values, setValues] = useState<Record<string, string>>({recette: item.nom});
  const [extras, setExtras] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const steps = box ? ['base', 'boisson', 'récapitulatif'] : ['pain', 'base', 'recette', 'taille', 'formule', ...(values.formule === 'Menu' ? ['boisson'] : []), 'suppléments'];
  const group = steps[step];
  const drinks = menu.filter(x => x.customization_options?.creux_role === 'soft' && x.en_stock_bool);
  const options: Record<string, string[]> = {
    pain: breads, base: bases,
    recette: menu.filter(x => recipes.includes(x.nom) && x.en_stock_bool).map(x => x.nom),
    taille: values.recette === 'Le Savoyard' ? ['Double', 'Triple'] : ['Simple', 'Double', 'Triple'],
    formule: ['Seul', 'Menu'], boisson: drinks.map(x => x.nom),
  };
  const chosen = box ? item : menu.find(x => x.nom === values.recette);
  const basePrice = box ? 8.5 : values.taille && values.formule ? creuxPrice(values.recette, values.taille, values.formule, extras) : null;
  const valid = !!chosen?.en_stock_bool && !!values.base && (box || (!!values.pain && !!values.taille && !!values.formule)) && (!(box || values.formule === 'Menu') || drinks.some(x => x.nom === values.boisson));
  const last = step === steps.length - 1;
  const choose = (value: string) => setValues(old => {
    const next = {...old, [group]: value};
    if (group === 'recette') delete next.taille;
    if (group === 'formule') delete next.boisson;
    return next;
  });
  const confirm = () => {
    if (!valid || basePrice === null || !chosen) return;
    const selections = Object.entries(values).filter(([key]) => key !== 'recette' || !box).map(([key, value]) => selection(key, value));
    if (box) selections.push(selection('contenu', 'Frites généreuses + cheddar'));
    extras.forEach(x => selections.push(selection('supplement', x, 1)));
    addItem(chosen, {name: box ? 'Box' : `${values.taille} ${values.formule}`, price: basePrice}, selections, 0);
    close();
  };
  return <Dialog open onOpenChange={close}>
    <DialogContent className="max-w-lg w-[calc(100%-2rem)] max-h-[90dvh] flex flex-col p-5">
      <DialogTitle>{box ? 'Box étudiante' : "Au P’tit Creux"}</DialogTitle>
      <DialogDescription>Étape {step + 1}/{steps.length} : {group}</DialogDescription>
      <div className="overflow-y-auto min-h-0 space-y-3 py-3">
        {options[group] && <fieldset className="space-y-2"><legend className="sr-only">{group}</legend>{options[group].map(value => <label key={value} className="flex items-center gap-3 border rounded-lg p-3 min-h-12 cursor-pointer">
          <input type="radio" name={group} checked={values[group] === value} onChange={() => choose(value)} />
          <span className="break-words">{value}</span>
        </label>)}</fieldset>}
        {group === 'boisson' && drinks.length === 0 && <p role="status">Aucune boisson soft disponible. La formule ne peut pas être commandée actuellement.</p>}
        {group === 'suppléments' && ['Supplément bacon', 'Supplément fromage'].map(value => <label key={value} className="flex items-center gap-3 border rounded-lg p-3">
          <input type="checkbox" checked={extras.includes(value)} onChange={e => setExtras(old => e.target.checked ? [...old, value] : old.filter(x => x !== value))} />{value} (+1 €)
        </label>)}
        {last && <div className="border-t pt-3 space-y-1">{Object.entries(values).map(([key, value]) => <p key={key} className="text-sm break-words">{value}</p>)}{box && <p>Frites généreuses + cheddar</p>}</div>}
      </div>
      <div className="border-t pt-3 space-y-3">
        <p aria-live="polite" className="font-bold">{basePrice === null ? 'Choisissez votre formule' : `${basePrice.toFixed(2)} €`}</p>
        <div className="flex justify-between gap-3">
          <Button variant="outline" onClick={() => step ? setStep(step - 1) : close()}><ArrowLeft className="h-4 w-4 mr-2" />{step ? 'Retour' : 'Annuler'}</Button>
          <Button disabled={last ? !valid : !values[group] || (group === 'boisson' && !drinks.some(x => x.nom === values.boisson))} onClick={last ? confirm : () => setStep(step + 1)}>{last ? 'Ajouter' : 'Continuer'}<ArrowRight className="h-4 w-4 ml-2" /></Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}
