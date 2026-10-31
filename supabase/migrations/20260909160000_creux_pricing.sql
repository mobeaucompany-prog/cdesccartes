DO $$
DECLARE r uuid; n text;
BEGIN
  SELECT id INTO STRICT r FROM public.restaurants WHERE id='977c4d48-3161-4845-94a3-6a7ef05c9f0e' AND nom='Au Petit Creux 77';
  FOREACH n IN ARRAY ARRAY['Coca-Cola original','Coca-Cola zéro','Coca-Cola cherry','Coca-Cola vanille','Oasis tropical','Oasis framboise','Perrier','Schweppes Agrumes','7UP','7UP mojito','Orangina','Lipton Peach'] LOOP
    INSERT INTO public.menu_items(restaurant_id,nom,prix,categorie,en_stock_bool,customization_options)
    SELECT r,n,1.50,'Boissons',false,'{"creux_role":"soft","option_groups":[]}'::jsonb
    WHERE NOT EXISTS(SELECT 1 FROM public.menu_items WHERE restaurant_id=r AND nom=n);
    UPDATE public.menu_items SET customization_options=coalesce(customization_options,'{}'::jsonb)||'{"creux_role":"soft"}'::jsonb WHERE restaurant_id=r AND nom=n;
  END LOOP;
  INSERT INTO public.menu_items(restaurant_id,nom,prix,categorie,en_stock_bool)
  SELECT r,x.nom,x.prix,'Extras',false FROM (VALUES ('Frites',3.50),('Eau',1.00),('Heineken',2.50)) x(nom,prix)
  WHERE NOT EXISTS(SELECT 1 FROM public.menu_items m WHERE m.restaurant_id=r AND m.nom=x.nom);
END $$;

-- Dedicated RPC: all prices and drink availability are checked on the server.
CREATE OR REPLACE FUNCTION public.create_creux_order_secure(p_client_name text,p_items jsonb,p_pickup_time text,p_restaurant_id uuid)
RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  m public.menu_items; d public.menu_items; o public.orders; line jsonb; c jsonb; choices jsonb;
  clean jsonb:='[]'; normalized jsonb; recipe text; size text; formula text; bread text; base text; drink text;
  price numeric; total numeric:=0; qty integer; recent integer; box boolean; meal boolean; surcharge numeric;
BEGIN
  IF p_restaurant_id IS DISTINCT FROM '977c4d48-3161-4845-94a3-6a7ef05c9f0e'::uuid THEN RAISE EXCEPTION 'Restaurant invalide'; END IF;
  IF p_client_name IS NULL OR length(trim(p_client_name)) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Nom invalide'; END IF;
  IF p_pickup_time IS NULL OR p_pickup_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN RAISE EXCEPTION 'Heure invalide'; END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items)<>'array' THEN RAISE EXCEPTION 'Panier invalide'; END IF;
  IF jsonb_array_length(p_items) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Panier invalide'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_restaurant_id::text,0));
  SELECT count(*) INTO recent FROM public.orders WHERE restaurant_id=p_restaurant_id AND created_at>now()-interval '1 minute';
  IF recent>=10 THEN RAISE EXCEPTION 'Trop de commandes'; END IF;
  FOR line IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    IF coalesce(line->>'quantity','') !~ '^[0-9]{1,3}$' THEN RAISE EXCEPTION 'Quantité invalide'; END IF;
    qty:=(line->>'quantity')::integer;
    IF qty<1 THEN RAISE EXCEPTION 'Quantité invalide'; END IF;
    SELECT * INTO m FROM public.menu_items WHERE id=left(line->>'id',36)::uuid AND restaurant_id=p_restaurant_id FOR SHARE;
    IF NOT FOUND OR NOT m.en_stock_bool THEN RAISE EXCEPTION 'Article indisponible'; END IF;
    box:=m.nom='Box étudiante';
    meal:=box OR m.nom IN ('Le Classic','Le Chèvre Miel','Le Brie','Le Raclette','Le Bleu','Le Savoyard');
    choices:=coalesce(line->'customizations','[]'); normalized:='[]';
    IF jsonb_typeof(choices)<>'array' THEN RAISE EXCEPTION 'Choix invalides'; END IF;
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(choices) x WHERE x->>'group_id' IS NULL OR x->>'option_name' IS NULL) THEN RAISE EXCEPTION 'Choix incomplet'; END IF;
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(choices) x GROUP BY x->>'group_id',x->>'option_name' HAVING count(*)>1) THEN RAISE EXCEPTION 'Choix dupliqué'; END IF;
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(choices) x WHERE x->>'group_id'<>'supplement' GROUP BY x->>'group_id' HAVING count(*)>1) THEN RAISE EXCEPTION 'Un seul choix par étape'; END IF;
    IF meal THEN
      SELECT max(x->>'option_name') FILTER(WHERE x->>'group_id'='pain'),max(x->>'option_name') FILTER(WHERE x->>'group_id'='base'),max(x->>'option_name') FILTER(WHERE x->>'group_id'='recette'),max(x->>'option_name') FILTER(WHERE x->>'group_id'='taille'),max(x->>'option_name') FILTER(WHERE x->>'group_id'='formule'),max(x->>'option_name') FILTER(WHERE x->>'group_id'='boisson') INTO bread,base,recipe,size,formula,drink FROM jsonb_array_elements(choices) x;
      IF base IS NULL OR base NOT IN ('Steak haché 100% pur bœuf','Chicken','Merguez de veau','Galette rösti/tater rösti','Cordon Bleu') THEN RAISE EXCEPTION 'Base invalide'; END IF;
      IF box THEN
        price:=8.50;
        IF EXISTS(SELECT 1 FROM jsonb_array_elements(choices) x WHERE x->>'group_id' NOT IN ('base','boisson','contenu')) THEN RAISE EXCEPTION 'Choix Box invalide'; END IF;
      ELSE
        IF bread IS NULL OR bread NOT IN ('Pain brioché/Burger','Demi-baguette','Wrap/galette de blé') THEN RAISE EXCEPTION 'Pain invalide'; END IF;
        IF recipe IS DISTINCT FROM m.nom OR size IS NULL OR size NOT IN ('Simple','Double','Triple') OR formula IS NULL OR formula NOT IN ('Seul','Menu') THEN RAISE EXCEPTION 'Formule invalide'; END IF;
        IF recipe='Le Savoyard' AND size='Simple' THEN RAISE EXCEPTION 'Savoyard Simple indisponible'; END IF;
        price:=(CASE WHEN recipe='Le Classic' THEN 8 ELSE 9 END)+(CASE size WHEN 'Simple' THEN 0 WHEN 'Double' THEN 2 ELSE 4 END)+(CASE formula WHEN 'Menu' THEN 2 ELSE 0 END);
        IF EXISTS(SELECT 1 FROM jsonb_array_elements(choices) x WHERE x->>'group_id' NOT IN ('pain','base','recette','taille','formule','boisson','supplement')) THEN RAISE EXCEPTION 'Choix inconnu'; END IF;
        IF formula='Seul' AND drink IS NOT NULL THEN RAISE EXCEPTION 'Boisson hors formule'; END IF;
      END IF;
      IF box OR formula='Menu' THEN
        SELECT * INTO d FROM public.menu_items WHERE restaurant_id=p_restaurant_id AND nom=drink AND customization_options->>'creux_role'='soft' FOR SHARE;
        IF NOT FOUND OR NOT d.en_stock_bool THEN RAISE EXCEPTION 'Boisson soft indisponible'; END IF;
      END IF;
      FOR c IN SELECT * FROM jsonb_array_elements(choices) LOOP
        surcharge:=0;
        IF c->>'group_id'='supplement' THEN
          IF c->>'option_name' NOT IN ('Supplément bacon','Supplément fromage') THEN RAISE EXCEPTION 'Supplément invalide'; END IF;
          surcharge:=1; price:=price+1;
        END IF;
        IF c->>'group_id'<>'contenu' THEN normalized:=normalized||jsonb_build_array(jsonb_build_object('group_id',c->>'group_id','option_name',c->>'option_name','price_supplement',surcharge)); END IF;
      END LOOP;
      IF box THEN normalized:=normalized||jsonb_build_array(jsonb_build_object('group_id','contenu','option_name','Frites généreuses + cheddar','price_supplement',0)); END IF;
    ELSE
      IF jsonb_array_length(choices)>0 OR line->>'selectedSize' IS NOT NULL THEN RAISE EXCEPTION 'Article sans personnalisation'; END IF;
      price:=CASE WHEN m.customization_options->>'creux_role'='soft' THEN 1.50 WHEN m.nom='Frites' THEN 3.50 WHEN m.nom='Eau' THEN 1 WHEN m.nom='Heineken' THEN 2.50 ELSE NULL END;
      IF price IS NULL THEN RAISE EXCEPTION 'Tarif non confirmé'; END IF;
    END IF;
    total:=total+price*qty;
    clean:=clean||jsonb_build_array(jsonb_build_object('id',line->>'id','nom',m.nom,'prix',price,'quantity',qty,'customizations',normalized,'selectedSize',CASE WHEN meal AND NOT box THEN size||' '||formula ELSE NULL END));
  END LOOP;
  INSERT INTO public.orders(client_name,items_list,total_price,pickup_time,restaurant_id,status,payment_status) VALUES(trim(p_client_name),clean,total,p_pickup_time,p_restaurant_id,'pending','pending') RETURNING * INTO o;
  RETURN o;
END $$;
REVOKE ALL ON FUNCTION public.create_creux_order_secure(text,jsonb,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_creux_order_secure(text,jsonb,text,uuid) TO service_role;
