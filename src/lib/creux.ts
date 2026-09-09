import type { MenuItem } from '@/types/database';
import type { SelectedOption } from '@/types/customization';

export const breads = ['Pain brioché/Burger', 'Demi-baguette', 'Wrap/galette de blé'];
export const bases = ['Steak haché 100% pur bœuf', 'Chicken', 'Merguez de veau', 'Galette rösti/tater rösti', 'Cordon Bleu'];
export const recipes = ['Le Classic', 'Le Chèvre Miel', 'Le Brie', 'Le Raclette', 'Le Bleu', 'Le Savoyard'];
export function creuxPrice(recipe: string, size: string, formula: string, extras: string[] = []) {
  if (!['Seul', 'Menu'].includes(formula)) throw new Error('Formule invalide');
  const index = ['Simple', 'Double', 'Triple'].indexOf(size);
  if (!recipes.includes(recipe) || index < 0 || (recipe === 'Le Savoyard' && index === 0)) throw new Error('Taille invalide');
  if (new Set(extras).size !== extras.length || extras.some(x => !['Supplément bacon', 'Supplément fromage'].includes(x))) throw new Error('Supplément invalide');
  return (recipe === 'Le Classic' ? 8 : 9) + index * 2 + (formula === 'Menu' ? 2 : 0) + extras.length;
}
export const isCreux = (name: string) => /^au\s+(?:petit|p['’]?tit)\s+creux(?: 77)?$/i.test(name.trim());
export const isCreuxMeal = (item: MenuItem) => recipes.includes(item.nom) || item.nom === 'Box étudiante';
export const selection = (group_id: string, option_name: string, price_supplement = 0): SelectedOption => ({group_id, option_name, price_supplement});
