import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = readFileSync(new URL('../src/lib/creux.ts', import.meta.url), 'utf8');
const {outputText} = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.ESNext}});
const {creuxPrice, isCreux} = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('Tous les tarifs photographiés et les deux suppléments', () => {
  const tables = {
    'Le Classic': [[8,10],[10,12],[12,14]],
    'Le Chèvre Miel': [[9,11],[11,13],[13,15]],
    'Le Brie': [[9,11],[11,13],[13,15]],
    'Le Raclette': [[9,11],[11,13],[13,15]],
    'Le Bleu': [[9,11],[11,13],[13,15]],
    'Le Savoyard': [null,[11,13],[13,15]],
  };
  for (const [recipe, prices] of Object.entries(tables)) {
    prices.forEach((pair, index) => {
      if (!pair) return;
      ['Seul','Menu'].forEach((formula,f) => {
        assert.equal(creuxPrice(recipe,['Simple','Double','Triple'][index],formula),pair[f]);
        assert.equal(creuxPrice(recipe,['Simple','Double','Triple'][index],formula,['Supplément bacon','Supplément fromage']),pair[f]+2);
      });
    });
  }
});
test('Refuse les combinaisons et suppléments non confirmés', () => {
  assert.throws(() => creuxPrice('Le Savoyard','Simple','Menu'));
  assert.throws(() => creuxPrice('Le Classic','Double','Gratuit'));
  assert.throws(() => creuxPrice('Le Classic','Quadruple','Seul'));
  assert.throws(() => creuxPrice('Inconnu','Simple','Seul'));
  assert.throws(() => creuxPrice('Le Classic','Simple','Seul',['Supplément bacon','Supplément bacon']));
  assert.throws(() => creuxPrice('Le Classic','Simple','Seul',['Truffe']));
});
test('Activation limitée au restaurant exact', () => {
  for (const name of ['Au Petit Creux 77','Au Petit Creux',"Au P'tit Creux",'Au P’tit Creux','Au Ptit Creux']) assert.equal(isCreux(name),true);
  for (const name of ['Les Lumières','Good and Tasty','Autre Creux']) assert.equal(isCreux(name),false);
});
