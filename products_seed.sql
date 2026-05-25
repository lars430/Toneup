-- Toneup product seed
-- Lim inn i Supabase Dashboard → SQL Editor og kjør

insert into products (brand, name, category, price_tier, attributes, verified) values

-- MOISTURIZERS
('La Roche-Posay', 'Toleriane Double Repair Face Moisturizer', 'moisturizer', 'mid', '{"skinType":["dry","sensitive"],"keyIngredients":["ceramides","niacinamide"]}', true),
('CeraVe', 'Moisturizing Cream', 'moisturizer', 'budget', '{"skinType":["dry","normal"],"keyIngredients":["ceramides","hyaluronic acid"]}', true),
('Cetaphil', 'Rich Hydrating Night Cream', 'moisturizer', 'budget', '{"skinType":["dry","sensitive"],"keyIngredients":["hyaluronic acid","vitamin E"]}', true),
('Neutrogena', 'Hydro Boost Water Gel', 'moisturizer', 'budget', '{"skinType":["oily","combination"],"keyIngredients":["hyaluronic acid"]}', true),
('First Aid Beauty', 'Ultra Repair Cream', 'moisturizer', 'mid', '{"skinType":["dry","sensitive"],"keyIngredients":["colloidal oatmeal","ceramides"]}', true),
('Kiehl''s', 'Ultra Facial Cream', 'moisturizer', 'premium', '{"skinType":["all"],"keyIngredients":["squalane","glacial glycoprotein"]}', true),
('Tatcha', 'The Water Cream', 'moisturizer', 'luxury', '{"skinType":["oily","combination"],"keyIngredients":["hadasei-3","japanese wild rose"]}', true),
('Drunk Elephant', 'Lala Retro Whipped Cream', 'moisturizer', 'luxury', '{"skinType":["dry","sensitive"],"keyIngredients":["ceramides","fatty acids"]}', true),
('Paula''s Choice', 'RESIST Barrier Repair Moisturizer', 'moisturizer', 'premium', '{"skinType":["dry","normal"],"keyIngredients":["ceramides","peptides"]}', true),
('The Inkey List', 'Oat Cleansing Balm', 'moisturizer', 'budget', '{"skinType":["dry","sensitive"],"keyIngredients":["oat extract"]}', true),
('Eucerin', 'Q10 Anti-Wrinkle Face Cream', 'moisturizer', 'mid', '{"skinType":["mature","dry"],"keyIngredients":["Q10","vitamin E"]}', true),
('Aveeno', 'Positively Radiant Daily Moisturizer SPF 15', 'moisturizer', 'budget', '{"skinType":["normal","combination"],"keyIngredients":["soy","SPF15"]}', true),
('NIOD', 'CAIS2', 'moisturizer', 'luxury', '{"skinType":["all"],"keyIngredients":["copper amino isolate"]}', true),
('Augustinus Bader', 'The Cream', 'moisturizer', 'luxury', '{"skinType":["all"],"keyIngredients":["TFC8","amino acids"]}', true),
('Bioderma', 'Sensibio AR BB Cream', 'moisturizer', 'mid', '{"skinType":["sensitive","redness"],"keyIngredients":["zinc","enoxolone"]}', true),

-- SERUMS
('The Ordinary', 'Hyaluronic Acid 2% + B5', 'serum', 'budget', '{"keyIngredients":["hyaluronic acid","vitamin B5"],"concern":"hydration"}', true),
('The Ordinary', 'Niacinamide 10% + Zinc 1%', 'serum', 'budget', '{"keyIngredients":["niacinamide","zinc"],"concern":"pores,oiliness"}', true),
('The Ordinary', 'Retinol 0.5% in Squalane', 'serum', 'budget', '{"keyIngredients":["retinol","squalane"],"concern":"anti-aging"}', true),
('The Ordinary', 'AHA 30% + BHA 2% Peeling Solution', 'serum', 'budget', '{"keyIngredients":["glycolic acid","salicylic acid"],"concern":"exfoliation"}', true),
('The Ordinary', 'Vitamin C Suspension 23% + HA Spheres 2%', 'serum', 'budget', '{"keyIngredients":["vitamin C","hyaluronic acid"],"concern":"brightening"}', true),
('Paula''s Choice', 'C15 Super Booster', 'serum', 'premium', '{"keyIngredients":["vitamin C","vitamin E","ferulic acid"],"concern":"brightening"}', true),
('Paula''s Choice', 'RESIST 10% Niacinamide Booster', 'serum', 'premium', '{"keyIngredients":["niacinamide"],"concern":"pores,anti-aging"}', true),
('SkinCeuticals', 'C E Ferulic', 'serum', 'luxury', '{"keyIngredients":["vitamin C","vitamin E","ferulic acid"],"concern":"brightening,anti-aging"}', true),
('SkinCeuticals', 'Hydrating B5 Gel', 'serum', 'luxury', '{"keyIngredients":["hyaluronic acid","vitamin B5"],"concern":"hydration"}', true),
('Drunk Elephant', 'T.L.C. Framboos Glycolic Night Serum', 'serum', 'luxury', '{"keyIngredients":["glycolic acid","salicylic acid"],"concern":"exfoliation,brightening"}', true),
('Sunday Riley', 'Good Genes All-In-One Lactic Acid Treatment', 'serum', 'luxury', '{"keyIngredients":["lactic acid","licorice root"],"concern":"brightening,anti-aging"}', true),
('Ole Henriksen', 'Banana Bright Vitamin C Serum', 'serum', 'premium', '{"keyIngredients":["vitamin C","turmeric"],"concern":"brightening"}', true),
('Cosrx', 'Advanced Snail 96 Mucin Power Essence', 'serum', 'budget', '{"keyIngredients":["snail secretion filtrate"],"concern":"hydration,healing"}', true),
('NIOD', 'Multi-Molecular Hyaluronic Complex', 'serum', 'luxury', '{"keyIngredients":["hyaluronic acid","15 molecular weights"],"concern":"hydration"}', true),
('Medik8', 'Crystal Retinal 3', 'serum', 'premium', '{"keyIngredients":["retinaldehyde"],"concern":"anti-aging"}', true),
('Medik8', 'Crystal Retinal 6', 'serum', 'premium', '{"keyIngredients":["retinaldehyde"],"concern":"anti-aging"}', true),

-- CLEANSERS
('CeraVe', 'Hydrating Facial Cleanser', 'cleanser', 'budget', '{"skinType":["dry","sensitive"],"type":"cream"}', true),
('CeraVe', 'Foaming Facial Cleanser', 'cleanser', 'budget', '{"skinType":["oily","combination"],"type":"foam"}', true),
('La Roche-Posay', 'Toleriane Hydrating Gentle Cleanser', 'cleanser', 'mid', '{"skinType":["dry","sensitive"],"type":"cream"}', true),
('La Roche-Posay', 'Effaclar Gel Cleanser', 'cleanser', 'mid', '{"skinType":["oily","acne-prone"],"type":"gel"}', true),
('Bioderma', 'Sensibio H2O Micellar Water', 'cleanser', 'mid', '{"skinType":["sensitive"],"type":"micellar"}', true),
('Bioderma', 'Sebium Foaming Gel', 'cleanser', 'mid', '{"skinType":["oily","combination"],"type":"gel"}', true),
('The Inkey List', 'Oat Cleansing Balm', 'cleanser', 'budget', '{"skinType":["dry","sensitive"],"type":"balm"}', true),
('Elemis', 'Pro-Collagen Cleansing Balm', 'cleanser', 'luxury', '{"skinType":["all"],"type":"balm"}', true),
('Emma S.', 'Gentle Jelly Cleanser', 'cleanser', 'mid', '{"skinType":["all"],"type":"gel"}', false),
('Cosrx', 'Low pH Good Morning Gel Cleanser', 'cleanser', 'budget', '{"skinType":["oily","combination"],"type":"gel","ph":"5.5"}', true),
('Tatcha', 'The Deep Cleanse', 'cleanser', 'luxury', '{"skinType":["oily","combination"],"type":"gel"}', true),
('Drunk Elephant', 'Beste No. 9 Jelly Cleanser', 'cleanser', 'luxury', '{"skinType":["all"],"type":"gel"}', true),
('Paula''s Choice', 'Optimal Results Hydrating Cleanser', 'cleanser', 'premium', '{"skinType":["dry","normal"],"type":"cream"}', true),

-- SUNSCREENS
('La Roche-Posay', 'Anthelios Invisible Fluid SPF50+', 'sunscreen', 'mid', '{"spf":50,"type":"chemical","finish":"invisible"}', true),
('La Roche-Posay', 'Anthelios Uvmune 400 Invisible Fluid SPF50+', 'sunscreen', 'mid', '{"spf":50,"type":"chemical","finish":"invisible"}', true),
('Altruist', 'Sunscreen Fluid SPF50', 'sunscreen', 'budget', '{"spf":50,"type":"chemical","finish":"fluid"}', true),
('Paula''s Choice', 'RESIST Super-Light Wrinkle Defense SPF 30', 'sunscreen', 'premium', '{"spf":30,"type":"chemical","finish":"light"}', true),
('Isdin', 'Eryfotona Actinica SPF50+', 'sunscreen', 'premium', '{"spf":50,"type":"mineral","finish":"fluid","bonus":"DNA repair"}', true),
('Cosrx', 'Aloe Soothing Sun Cream SPF50', 'sunscreen', 'budget', '{"spf":50,"type":"chemical","finish":"cream"}', true),
('Biore', 'UV Aqua Rich Watery Essence SPF50+', 'sunscreen', 'mid', '{"spf":50,"type":"chemical","finish":"watery"}', true),
('EltaMD', 'UV Clear Broad-Spectrum SPF46', 'sunscreen', 'premium', '{"spf":46,"type":"mineral","skinType":["acne-prone","sensitive"]}', true),
('Avène', 'Sun Very High Protection Cream SPF50+', 'sunscreen', 'mid', '{"spf":50,"type":"chemical","skinType":["sensitive"]}', true),

-- TONERS
('Paula''s Choice', 'Skin Perfecting 2% BHA Liquid Exfoliant', 'toner', 'premium', '{"keyIngredients":["salicylic acid"],"concern":"pores,acne"}', true),
('Paula''s Choice', 'Skin Perfecting 8% AHA Gel Exfoliant', 'toner', 'premium', '{"keyIngredients":["glycolic acid"],"concern":"exfoliation,brightening"}', true),
('Cosrx', 'AHA/BHA Clarifying Treatment Toner', 'toner', 'budget', '{"keyIngredients":["glycolic acid","betaine salicylate"],"concern":"exfoliation"}', true),
('Pixi', 'Glow Tonic', 'toner', 'mid', '{"keyIngredients":["glycolic acid","aloe vera"],"concern":"brightening"}', true),
('Klairs', 'Supple Preparation Toner', 'toner', 'mid', '{"keyIngredients":["hyaluronic acid","amino acids"],"concern":"hydration"}', true),
('Missha', 'Time Revolution The First Treatment Essence', 'toner', 'mid', '{"keyIngredients":["fermented yeast","niacinamide"],"concern":"brightening,anti-aging"}', true),
('SK-II', 'Facial Treatment Essence', 'toner', 'luxury', '{"keyIngredients":["Pitera (galactomyces)"],"concern":"brightening,anti-aging"}', true),
('Thayers', 'Witch Hazel Facial Toner with Aloe Vera', 'toner', 'budget', '{"keyIngredients":["witch hazel","aloe vera"],"concern":"pores,oiliness"}', true),

-- EYE CREAMS
('Kiehl''s', 'Creamy Eye Treatment with Avocado', 'eye_cream', 'premium', '{"keyIngredients":["avocado butter","beta-carotene"],"concern":"dryness"}', true),
('Cetaphil', 'Hydrating Eye Gel-Cream', 'eye_cream', 'budget', '{"keyIngredients":["hyaluronic acid","vitamin B3"],"concern":"hydration,puffiness"}', true),
('Paula''s Choice', 'RESIST Anti-Aging Eye Cream', 'eye_cream', 'premium', '{"keyIngredients":["retinol","peptides"],"concern":"anti-aging"}', true),
('The Inkey List', 'Caffeine Eye Cream', 'eye_cream', 'budget', '{"keyIngredients":["caffeine","peptides"],"concern":"dark circles,puffiness"}', true),
('Drunk Elephant', 'Shaba Complex Eye Serum', 'eye_cream', 'luxury', '{"keyIngredients":["copper peptides","neuropeptides"],"concern":"anti-aging"}', true),
('Tatcha', 'The Kissu Lip Mask', 'eye_cream', 'luxury', '{"keyIngredients":["japanese peach","squalane"],"concern":"anti-aging"}', true),

-- OILS
('The Ordinary', 'Squalane', 'oil', 'budget', '{"keyIngredients":["squalane"],"concern":"hydration,barrier"}', true),
('Kiehl''s', 'Daily Reviving Concentrate', 'oil', 'premium', '{"keyIngredients":["ginger root","tamanu oil"],"concern":"radiance"}', true),
('Sunday Riley', 'Luna Sleeping Night Oil', 'oil', 'luxury', '{"keyIngredients":["retinol","blue tansy"],"concern":"anti-aging,brightening"}', true),
('Drunk Elephant', 'Virgin Marula Luxury Face Oil', 'oil', 'luxury', '{"keyIngredients":["marula oil","omega fatty acids"],"concern":"hydration,barrier"}', true),
('Pai Skincare', 'Rosehip BioRegenerate Oil', 'oil', 'premium', '{"keyIngredients":["rosehip","rosehip seed"],"concern":"brightening,scars"}', true),
('The Inkey List', 'Rosehip Oil', 'oil', 'budget', '{"keyIngredients":["rosehip oil"],"concern":"brightening,anti-aging"}', true),
('Biossance', 'Squalane + Vitamin C Rose Oil', 'oil', 'premium', '{"keyIngredients":["squalane","vitamin C","rosehip"],"concern":"brightening"}', true),

-- FOUNDATIONS
('Fenty Beauty', 'Pro Filt''r Soft Matte Longwear Foundation', 'foundation', 'mid', '{"finish":"matte","coverage":"full","skinType":["oily","combination"]}', true),
('NARS', 'Natural Radiant Longwear Foundation', 'foundation', 'premium', '{"finish":"natural","coverage":"medium-full","skinType":["all"]}', true),
('Charlotte Tilbury', 'Beautiful Skin Foundation', 'foundation', 'premium', '{"finish":"radiant","coverage":"medium","skinType":["all"]}', true),
('Armani Beauty', 'Luminous Silk Foundation', 'foundation', 'luxury', '{"finish":"luminous","coverage":"medium","skinType":["all"]}', true),
('NYX', 'Bare With Me Blur Tint Foundation', 'foundation', 'budget', '{"finish":"blur","coverage":"light-medium","skinType":["all"]}', true),
('Maybelline', 'Fit Me Matte + Poreless Foundation', 'foundation', 'budget', '{"finish":"matte","coverage":"medium","skinType":["oily","combination"]}', true),
('L''Oréal', 'True Match Super-Blendable Foundation', 'foundation', 'budget', '{"finish":"natural","coverage":"light-medium","skinType":["all"]}', true),
('MAC', 'Studio Fix Fluid SPF 15 Foundation', 'foundation', 'premium', '{"finish":"matte","coverage":"full","spf":15,"skinType":["oily"]}', true),
('Estée Lauder', 'Double Wear Stay-in-Place Foundation', 'foundation', 'premium', '{"finish":"matte","coverage":"full","skinType":["oily","combination"]}', true),
('bareMinerals', 'COMPLEXION RESCUE Tinted Hydrating Gel Cream SPF 30', 'foundation', 'mid', '{"finish":"natural","coverage":"light","spf":30,"type":"tinted moisturizer"}', true),
('ILIA', 'True Skin Serum Foundation', 'foundation', 'premium', '{"finish":"natural","coverage":"light-medium","type":"serum","skinType":["all"]}', true),
('Rare Beauty', 'Liquid Touch Weightless Foundation', 'foundation', 'mid', '{"finish":"natural","coverage":"medium","skinType":["all"]}', true);
