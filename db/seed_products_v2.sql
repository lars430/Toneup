-- ============================================================
-- TONEUP — Seed batch v2 (May 2026)
-- Adds ~230 products from brands popular in Norwegian retail:
--   direct sales (Oriflame, Mary Kay, Herbalife, Avon, Younique, Arbonne)
--   chain own-brands (Kicks, Vita, Boots No7, Lyko)
--   K-beauty expansion (Etude House, Banila Co, Klairs, Pyunkang Yul,
--                       Torriden, Mediheal, Mizon, Purito, +Cosrx,
--                       +Beauty of Joseon, +Anua)
--   pro skincare (Babor, Dermalogica, IS Clinical, Filorga, Esthederm,
--                 Image Skincare)
--   pharmacy expansion (Olay, Pond's, A-Derma, more Vichy/LRP/Avene)
--   hair (Briogeo, Oribe, Living Proof, Bumble and Bumble, Davines)
--   body (more Rituals, Sol de Janeiro)
-- All start verified=false. Conflict-safe (skips duplicates).
-- ============================================================

insert into products (id, brand, name, category, shade_name, shade_code, price_tier, attributes, verified, origin_country) values

-- ============================================================
-- ORIFLAME (Sweden)
-- ============================================================
('f1000001-0000-4000-a000-000000000001', 'Oriflame', 'NovAge Ultimate Lift Lifting Day Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["mature","normal","dry"],"concern":["anti-aging","firming"],"key_ingredient":"acetyl tetrapeptide"}'::jsonb, false, 'SE'),
('f1000001-0000-4000-a000-000000000002', 'Oriflame', 'NovAge Ultimate Lift Lifting Night Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["mature","normal","dry"],"concern":["anti-aging","firming"]}'::jsonb, false, 'SE'),
('f1000001-0000-4000-a000-000000000003', 'Oriflame', 'NovAge Ultimate Lift Concentrate', 'serum', NULL, NULL, 'mid', '{"skin_type":["mature","all"],"concern":["anti-aging","firming"],"pregnancy_safe":true}'::jsonb, false, 'SE'),
('f1000001-0000-4000-a000-000000000004', 'Oriflame', 'NovAge Bright Sublime Day Cream SPF20', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["brightening","dark spots"],"spf":20,"key_ingredient":"vitamin c"}'::jsonb, false, 'SE'),
('f1000001-0000-4000-a000-000000000005', 'Oriflame', 'NovAge Bright Sublime Night Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["brightening","even_tone"],"key_ingredient":"niacinamide"}'::jsonb, false, 'SE'),
('f1000001-0000-4000-a000-000000000006', 'Oriflame', 'NovAge Skinrunner Hydration Serum', 'serum', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["hydration"],"key_ingredient":"hyaluronic acid","pregnancy_safe":true}'::jsonb, false, 'SE'),
('f1000001-0000-4000-a000-000000000007', 'Oriflame', 'Optimals Hydra Care Day Cream', 'moisturizer', NULL, NULL, 'budget', '{"skin_type":["normal","dry"],"concern":["hydration"]}'::jsonb, false, 'SE'),
('f1000001-0000-4000-a000-000000000008', 'Oriflame', 'Optimals Even Out Serum', 'serum', NULL, NULL, 'budget', '{"skin_type":["all"],"concern":["even_tone","brightening"]}'::jsonb, false, 'SE'),
('f1000001-0000-4000-a000-000000000009', 'Oriflame', 'Tender Care Protecting Balm', 'lip_care', NULL, NULL, 'budget', '{"concern":["hydration","barrier"]}'::jsonb, false, 'SE'),
('f1000001-0000-4000-a000-00000000000a', 'Oriflame', 'Milk & Honey Gold Nourishing Hand & Body Cream', 'body_cream', NULL, NULL, 'budget', '{"concern":["nourishing"]}'::jsonb, false, 'SE'),
('f1000001-0000-4000-a000-00000000000b', 'Oriflame', 'Milk & Honey Gold Smoothing Body Scrub', 'body_scrub', NULL, NULL, 'budget', '{"concern":["exfoliation"]}'::jsonb, false, 'SE'),
('f1000001-0000-4000-a000-00000000000c', 'Oriflame', 'Love Nature Tea Tree Purifying Mask', 'mask', NULL, NULL, 'budget', '{"skin_type":["oily","combination"],"concern":["pores","acne"],"key_ingredient":"tea tree"}'::jsonb, false, 'SE'),
('f1000001-0000-4000-a000-00000000000d', 'Oriflame', 'The ONE 5-in-1 Foundation', 'foundation', 'Porcelain', NULL, 'budget', '{"hex":"#F5DCC8","depth":"fair","undertone":"cool","finish":"natural","coverage":"medium","spf":15}'::jsonb, false, 'SE'),
('f1000001-0000-4000-a000-00000000000e', 'Oriflame', 'The ONE 5-in-1 Foundation', 'foundation', 'Light Ivory', NULL, 'budget', '{"hex":"#EBCBA8","depth":"fair","undertone":"warm","finish":"natural","coverage":"medium","spf":15}'::jsonb, false, 'SE'),
('f1000001-0000-4000-a000-00000000000f', 'Oriflame', 'The ONE 5-in-1 Foundation', 'foundation', 'Natural Beige', NULL, 'budget', '{"hex":"#DDB791","depth":"light","undertone":"neutral","finish":"natural","coverage":"medium","spf":15}'::jsonb, false, 'SE'),
('f1000001-0000-4000-a000-000000000010', 'Oriflame', 'The ONE 5-in-1 Foundation', 'foundation', 'Warm Beige', NULL, 'budget', '{"hex":"#C8A068","depth":"medium","undertone":"warm","finish":"natural","coverage":"medium","spf":15}'::jsonb, false, 'SE'),
('f1000001-0000-4000-a000-000000000011', 'Oriflame', 'The ONE Lash Sensation Mascara', 'mascara', 'Black', NULL, 'budget', '{"finish":"volumizing"}'::jsonb, false, 'SE'),
('f1000001-0000-4000-a000-000000000012', 'Oriflame', 'The ONE Colour Stylist Lipstick', 'lipstick', 'Vintage Rose', NULL, 'budget', '{"hex":"#C88080","undertone":"cool","finish":"satin"}'::jsonb, false, 'SE'),
('f1000001-0000-4000-a000-000000000013', 'Oriflame', 'The ONE Lip Sensation Lipstick', 'lipstick', 'Hot Pink', NULL, 'budget', '{"hex":"#D04070","undertone":"cool","finish":"matte"}'::jsonb, false, 'SE'),
('f1000001-0000-4000-a000-000000000014', 'Oriflame', 'Eye Make-Up Remover', 'cleanser', NULL, NULL, 'budget', '{"skin_type":["sensitive","all"],"concern":["makeup removal"]}'::jsonb, false, 'SE'),
('f1000001-0000-4000-a000-000000000015', 'Oriflame', 'Possibility Eau de Toilette', 'fragrance', NULL, NULL, 'mid', '{"gender":"women","family":"floral fruity"}'::jsonb, false, 'SE'),

-- ============================================================
-- MARY KAY
-- ============================================================
('f2000002-0000-4000-a000-000000000001', 'Mary Kay', 'TimeWise 3D Day Cream SPF 30', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["anti-aging","protection"],"spf":30}'::jsonb, false, 'US'),
('f2000002-0000-4000-a000-000000000002', 'Mary Kay', 'TimeWise 3D Night Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["anti-aging","hydration"]}'::jsonb, false, 'US'),
('f2000002-0000-4000-a000-000000000003', 'Mary Kay', 'TimeWise Repair Volu-Firm Foaming Cleanser', 'cleanser', NULL, NULL, 'mid', '{"skin_type":["mature","all"],"concern":["anti-aging"]}'::jsonb, false, 'US'),
('f2000002-0000-4000-a000-000000000004', 'Mary Kay', 'TimeWise Repair Volu-Firm Day Cream SPF30', 'moisturizer', NULL, NULL, 'premium', '{"skin_type":["mature"],"concern":["anti-aging","firming"],"spf":30}'::jsonb, false, 'US'),
('f2000002-0000-4000-a000-000000000005', 'Mary Kay', 'TimeWise Repair Volu-Firm Night Treatment', 'moisturizer', NULL, NULL, 'premium', '{"skin_type":["mature"],"concern":["anti-aging","firming"]}'::jsonb, false, 'US'),
('f2000002-0000-4000-a000-000000000006', 'Mary Kay', 'TimeWise Repair Volu-Firm Eye Renewal Cream', 'eye_cream', NULL, NULL, 'premium', '{"concern":["anti-aging","firming"]}'::jsonb, false, 'US'),
('f2000002-0000-4000-a000-000000000007', 'Mary Kay', 'TimeWise Replenishing Serum C+E', 'serum', NULL, NULL, 'premium', '{"skin_type":["all"],"concern":["brightening","anti-aging"],"key_ingredient":"vitamin c","pregnancy_safe":true}'::jsonb, false, 'US'),
('f2000002-0000-4000-a000-000000000008', 'Mary Kay', 'Botanical Effects Cleansing Gel', 'cleanser', NULL, NULL, 'mid', '{"skin_type":["normal","oily"]}'::jsonb, false, 'US'),
('f2000002-0000-4000-a000-000000000009', 'Mary Kay', 'Botanical Effects Hydrating Gel Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["normal","combination"],"concern":["hydration"]}'::jsonb, false, 'US'),
('f2000002-0000-4000-a000-00000000000a', 'Mary Kay', 'TimeWise Matte 3D Foundation', 'foundation', 'Ivory N130', NULL, 'mid', '{"hex":"#F0D4BD","depth":"fair","undertone":"neutral","finish":"matte","coverage":"medium"}'::jsonb, false, 'US'),
('f2000002-0000-4000-a000-00000000000b', 'Mary Kay', 'TimeWise Matte 3D Foundation', 'foundation', 'Beige W150', NULL, 'mid', '{"hex":"#DDB791","depth":"light","undertone":"warm","finish":"matte","coverage":"medium"}'::jsonb, false, 'US'),
('f2000002-0000-4000-a000-00000000000c', 'Mary Kay', 'TimeWise Matte 3D Foundation', 'foundation', 'Bronze W190', NULL, 'mid', '{"hex":"#AB7F4D","depth":"medium","undertone":"warm","finish":"matte","coverage":"medium"}'::jsonb, false, 'US'),
('f2000002-0000-4000-a000-00000000000d', 'Mary Kay', 'TimeWise Luminous 3D Foundation', 'foundation', 'Ivory C100', NULL, 'mid', '{"hex":"#F5DCC8","depth":"fair","undertone":"cool","finish":"radiant","coverage":"medium"}'::jsonb, false, 'US'),
('f2000002-0000-4000-a000-00000000000e', 'Mary Kay', 'TimeWise Luminous 3D Foundation', 'foundation', 'Beige N160', NULL, 'mid', '{"hex":"#C8A068","depth":"medium","undertone":"neutral","finish":"radiant","coverage":"medium"}'::jsonb, false, 'US'),
('f2000002-0000-4000-a000-00000000000f', 'Mary Kay', 'Ultimate Mascara', 'mascara', 'Black', NULL, 'mid', '{"finish":"volumizing"}'::jsonb, false, 'US'),
('f2000002-0000-4000-a000-000000000010', 'Mary Kay', 'Gel Semi-Matte Lipstick', 'lipstick', 'Mauve Moment', NULL, 'mid', '{"hex":"#A07080","undertone":"cool","finish":"matte"}'::jsonb, false, 'US'),

-- ============================================================
-- HERBALIFE SKIN
-- ============================================================
('f3000003-0000-4000-a000-000000000001', 'Herbalife SKIN', 'Polishing Citrus Cleanser', 'cleanser', NULL, NULL, 'mid', '{"skin_type":["normal","oily"],"concern":["brightening"],"key_ingredient":"vitamin c"}'::jsonb, false, 'US'),
('f3000003-0000-4000-a000-000000000002', 'Herbalife SKIN', 'Soothing Aloe Cleanser', 'cleanser', NULL, NULL, 'mid', '{"skin_type":["sensitive","dry"],"concern":["soothing"],"key_ingredient":"aloe vera"}'::jsonb, false, 'US'),
('f3000003-0000-4000-a000-000000000003', 'Herbalife SKIN', 'Daily Glow Moisturiser SPF15', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["protection","glow"],"spf":15}'::jsonb, false, 'US'),
('f3000003-0000-4000-a000-000000000004', 'Herbalife SKIN', 'Replenishing Night Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["normal","dry"],"concern":["hydration","anti-aging"]}'::jsonb, false, 'US'),
('f3000003-0000-4000-a000-000000000005', 'Herbalife SKIN', 'Hydrating Eye Cream', 'eye_cream', NULL, NULL, 'mid', '{"concern":["hydration"]}'::jsonb, false, 'US'),
('f3000003-0000-4000-a000-000000000006', 'Herbalife SKIN', 'Line Minimising Serum', 'serum', NULL, NULL, 'mid', '{"skin_type":["mature"],"concern":["anti-aging"]}'::jsonb, false, 'US'),
('f3000003-0000-4000-a000-000000000007', 'Herbalife SKIN', 'Instant Reveal Berry Scrub', 'exfoliant', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["texture","glow"]}'::jsonb, false, 'US'),
('f3000003-0000-4000-a000-000000000008', 'Herbalife SKIN', 'Purifying Mint Clay Mask', 'mask', NULL, NULL, 'mid', '{"skin_type":["oily","combination"],"concern":["pores"]}'::jsonb, false, 'US'),

-- ============================================================
-- AVON
-- ============================================================
('f4000004-0000-4000-a000-000000000001', 'Avon', 'Anew Reversalist Day Cream SPF25', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["mature"],"concern":["anti-aging"],"spf":25}'::jsonb, false, 'GB'),
('f4000004-0000-4000-a000-000000000002', 'Avon', 'Anew Reversalist Night Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["mature"],"concern":["anti-aging"]}'::jsonb, false, 'GB'),
('f4000004-0000-4000-a000-000000000003', 'Avon', 'Anew Vitamin C Brightening Serum', 'serum', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["brightening","dark spots"],"key_ingredient":"vitamin c","pregnancy_safe":true}'::jsonb, false, 'GB'),
('f4000004-0000-4000-a000-000000000004', 'Avon', 'Anew Hydra Fusion 1.5% Hyaluronic Acid Serum', 'serum', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["hydration"],"key_ingredient":"hyaluronic acid","pregnancy_safe":true}'::jsonb, false, 'GB'),
('f4000004-0000-4000-a000-000000000005', 'Avon', 'Anew Hydra Fusion Plumping Water-Gel', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["hydration"]}'::jsonb, false, 'GB'),
('f4000004-0000-4000-a000-000000000006', 'Avon', 'Anew Clinical Lift & Firm Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["mature"],"concern":["firming"]}'::jsonb, false, 'GB'),
('f4000004-0000-4000-a000-000000000007', 'Avon', 'Anew Platinum Tightening Eye Cream', 'eye_cream', NULL, NULL, 'mid', '{"concern":["anti-aging","firming"]}'::jsonb, false, 'GB'),
('f4000004-0000-4000-a000-000000000008', 'Avon', 'Avon True Color Flawless Foundation', 'foundation', 'Porcelain', NULL, 'budget', '{"hex":"#F5DCC8","depth":"fair","undertone":"cool","finish":"natural","coverage":"medium"}'::jsonb, false, 'GB'),
('f4000004-0000-4000-a000-000000000009', 'Avon', 'Avon True Color Flawless Foundation', 'foundation', 'Nude', NULL, 'budget', '{"hex":"#DDB791","depth":"light","undertone":"neutral","finish":"natural","coverage":"medium"}'::jsonb, false, 'GB'),
('f4000004-0000-4000-a000-00000000000a', 'Avon', 'Avon True Color Flawless Foundation', 'foundation', 'Caramel', NULL, 'budget', '{"hex":"#9A6430","depth":"tan","undertone":"warm","finish":"natural","coverage":"medium"}'::jsonb, false, 'GB'),
('f4000004-0000-4000-a000-00000000000b', 'Avon', 'Big & Bold Mascara', 'mascara', 'Black', NULL, 'budget', '{"finish":"volumizing"}'::jsonb, false, 'GB'),
('f4000004-0000-4000-a000-00000000000c', 'Avon', 'Ultra Matte Lipstick', 'lipstick', 'Adoring Love', NULL, 'budget', '{"hex":"#C04050","undertone":"warm","finish":"matte"}'::jsonb, false, 'GB'),
('f4000004-0000-4000-a000-00000000000d', 'Avon', 'Senses Bubble Bath', 'body_wash', 'Soft Musk', NULL, 'budget', '{"concern":["nourishing"]}'::jsonb, false, 'GB'),

-- ============================================================
-- YOUNIQUE
-- ============================================================
('f5000005-0000-4000-a000-000000000001', 'Younique', 'Moodstruck Epic Mascara', 'mascara', 'Black', NULL, 'mid', '{"finish":"volumizing","concern":["lengthening"]}'::jsonb, false, 'US'),
('f5000005-0000-4000-a000-000000000002', 'Younique', 'Touch Liquid Foundation', 'foundation', 'Velour', NULL, 'mid', '{"hex":"#F5DCC8","depth":"fair","undertone":"cool","finish":"natural","coverage":"medium"}'::jsonb, false, 'US'),
('f5000005-0000-4000-a000-000000000003', 'Younique', 'Touch Liquid Foundation', 'foundation', 'Organza', NULL, 'mid', '{"hex":"#DDB791","depth":"light","undertone":"neutral","finish":"natural","coverage":"medium"}'::jsonb, false, 'US'),
('f5000005-0000-4000-a000-000000000004', 'Younique', 'Touch Liquid Foundation', 'foundation', 'Suede', NULL, 'mid', '{"hex":"#AB7F4D","depth":"medium","undertone":"warm","finish":"natural","coverage":"medium"}'::jsonb, false, 'US'),
('f5000005-0000-4000-a000-000000000005', 'Younique', 'Splurge Cream Eyeshadow', 'eyeshadow', 'Regal', NULL, 'mid', '{"finish":"shimmer"}'::jsonb, false, 'US'),
('f5000005-0000-4000-a000-000000000006', 'Younique', 'Stiff Upper Lip Stain', 'lipstick', 'Resilient', NULL, 'mid', '{"hex":"#B04050","undertone":"warm","finish":"matte"}'::jsonb, false, 'US'),

-- ============================================================
-- ARBONNE
-- ============================================================
('f6000006-0000-4000-a000-000000000001', 'Arbonne', 'RE9 Advanced Restorative Day Crème SPF20', 'moisturizer', NULL, NULL, 'premium', '{"skin_type":["mature","all"],"concern":["anti-aging"],"spf":20,"vegan":true}'::jsonb, false, 'US'),
('f6000006-0000-4000-a000-000000000002', 'Arbonne', 'RE9 Advanced Renewing Gelée Night Cream', 'moisturizer', NULL, NULL, 'premium', '{"skin_type":["mature","all"],"concern":["anti-aging"],"vegan":true}'::jsonb, false, 'US'),
('f6000006-0000-4000-a000-000000000003', 'Arbonne', 'RE9 Advanced Smoothing Facial Cleanser', 'cleanser', NULL, NULL, 'premium', '{"skin_type":["all"],"vegan":true}'::jsonb, false, 'US'),
('f6000006-0000-4000-a000-000000000004', 'Arbonne', 'RE9 Advanced Corrective Eye Crème', 'eye_cream', NULL, NULL, 'premium', '{"concern":["anti-aging"],"vegan":true}'::jsonb, false, 'US'),
('f6000006-0000-4000-a000-000000000005', 'Arbonne', 'Calm Gentle Daily Cleanser', 'cleanser', NULL, NULL, 'premium', '{"skin_type":["sensitive"],"concern":["soothing"],"vegan":true,"fragrance_free":true}'::jsonb, false, 'US'),
('f6000006-0000-4000-a000-000000000006', 'Arbonne', 'Intelligence Liquid Foundation', 'foundation', 'Ivory', NULL, 'premium', '{"hex":"#EBCBA8","depth":"fair","undertone":"cool","finish":"natural","coverage":"medium","vegan":true}'::jsonb, false, 'US'),

-- ============================================================
-- KICKS BEAUTY (own brand)
-- ============================================================
('f7000007-0000-4000-a000-000000000001', 'Kicks Beauty', 'Glow Cleansing Foam', 'cleanser', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["brightening"]}'::jsonb, false, 'SE'),
('f7000007-0000-4000-a000-000000000002', 'Kicks Beauty', 'Hydrating Essence Toner', 'toner', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["hydration"],"key_ingredient":"hyaluronic acid"}'::jsonb, false, 'SE'),
('f7000007-0000-4000-a000-000000000003', 'Kicks Beauty', 'Plumping Serum', 'serum', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["hydration"],"key_ingredient":"hyaluronic acid","pregnancy_safe":true}'::jsonb, false, 'SE'),
('f7000007-0000-4000-a000-000000000004', 'Kicks Beauty', 'Nourishing Day Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["normal","dry"],"concern":["hydration"]}'::jsonb, false, 'SE'),
('f7000007-0000-4000-a000-000000000005', 'Kicks Beauty', 'Overnight Sleeping Mask', 'mask', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["hydration"]}'::jsonb, false, 'SE'),
('f7000007-0000-4000-a000-000000000006', 'Kicks Beauty', 'Reviving Eye Cream', 'eye_cream', NULL, NULL, 'mid', '{"concern":["hydration","dark circles"]}'::jsonb, false, 'SE'),
('f7000007-0000-4000-a000-000000000007', 'Kicks Beauty', 'Vitamin C Brightening Serum', 'serum', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["brightening"],"key_ingredient":"vitamin c","pregnancy_safe":true}'::jsonb, false, 'SE'),
('f7000007-0000-4000-a000-000000000008', 'Kicks Beauty', 'SPF50 Daily Sun Fluid', 'spf', NULL, NULL, 'mid', '{"spf":50,"skin_type":["all"],"finish":"natural"}'::jsonb, false, 'SE'),

-- ============================================================
-- VITA (Norway pharmacy chain own brand)
-- ============================================================
('f7000008-0000-4000-a000-000000000001', 'Vita', 'Daily Defence Day Cream', 'moisturizer', NULL, NULL, 'budget', '{"skin_type":["normal","dry"]}'::jsonb, false, 'NO'),
('f7000008-0000-4000-a000-000000000002', 'Vita', 'Hyaluron Plump Serum', 'serum', NULL, NULL, 'budget', '{"skin_type":["all"],"concern":["hydration"],"key_ingredient":"hyaluronic acid"}'::jsonb, false, 'NO'),
('f7000008-0000-4000-a000-000000000003', 'Vita', 'Mild Micellar Cleansing Water', 'cleanser', NULL, NULL, 'budget', '{"skin_type":["sensitive","all"]}'::jsonb, false, 'NO'),
('f7000008-0000-4000-a000-000000000004', 'Vita', 'Body Lotion Pure', 'body_lotion', NULL, NULL, 'budget', '{"fragrance_free":true,"skin_type":["sensitive"]}'::jsonb, false, 'NO'),
('f7000008-0000-4000-a000-000000000005', 'Vita', 'Hand Cream Rich', 'hand_cream', NULL, NULL, 'budget', '{"concern":["hydration"]}'::jsonb, false, 'NO'),
('f7000008-0000-4000-a000-000000000006', 'Vita', 'Sun Lotion Face SPF50', 'spf', NULL, NULL, 'budget', '{"spf":50}'::jsonb, false, 'NO'),

-- ============================================================
-- BOOTS No7 (UK pharmacy chain own brand, sold in Norway)
-- ============================================================
('f7000009-0000-4000-a000-000000000001', 'No7', 'Protect & Perfect Intense Advanced Serum', 'serum', NULL, NULL, 'mid', '{"skin_type":["mature","all"],"concern":["anti-aging"]}'::jsonb, false, 'GB'),
('f7000009-0000-4000-a000-000000000002', 'No7', 'Restore & Renew Multi Action Day Cream SPF30', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["mature"],"concern":["anti-aging"],"spf":30}'::jsonb, false, 'GB'),
('f7000009-0000-4000-a000-000000000003', 'No7', 'Restore & Renew Multi Action Night Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["mature"],"concern":["anti-aging"]}'::jsonb, false, 'GB'),
('f7000009-0000-4000-a000-000000000004', 'No7', 'Future Renew Damage Reversal Serum', 'serum', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["repair","anti-aging"]}'::jsonb, false, 'GB'),
('f7000009-0000-4000-a000-000000000005', 'No7', 'Lift & Luminate Triple Action Eye Cream', 'eye_cream', NULL, NULL, 'mid', '{"concern":["anti-aging","brightening"]}'::jsonb, false, 'GB'),
('f7000009-0000-4000-a000-000000000006', 'No7', 'Stay Perfect Foundation', 'foundation', 'Cool Ivory', NULL, 'mid', '{"hex":"#EBCBA8","depth":"fair","undertone":"cool","finish":"matte","coverage":"medium"}'::jsonb, false, 'GB'),
('f7000009-0000-4000-a000-000000000007', 'No7', 'Stay Perfect Foundation', 'foundation', 'Warm Beige', NULL, 'mid', '{"hex":"#DAB386","depth":"light","undertone":"warm","finish":"matte","coverage":"medium"}'::jsonb, false, 'GB'),
('f7000009-0000-4000-a000-000000000008', 'No7', 'Stay Perfect Foundation', 'foundation', 'Honey', NULL, 'mid', '{"hex":"#B08552","depth":"medium","undertone":"neutral","finish":"matte","coverage":"medium"}'::jsonb, false, 'GB'),

-- ============================================================
-- LYKO (Nordic own brand)
-- ============================================================
('f700000a-0000-4000-a000-000000000001', 'Lyko', 'Hydrating Cleanser', 'cleanser', NULL, NULL, 'mid', '{"skin_type":["normal","dry"],"concern":["hydration"]}'::jsonb, false, 'SE'),
('f700000a-0000-4000-a000-000000000002', 'Lyko', 'Glow Vitamin C Serum', 'serum', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["brightening"],"key_ingredient":"vitamin c","pregnancy_safe":true}'::jsonb, false, 'SE'),
('f700000a-0000-4000-a000-000000000003', 'Lyko', 'Calm Niacinamide Serum', 'serum', NULL, NULL, 'mid', '{"skin_type":["sensitive","oily"],"concern":["soothing","pores"],"key_ingredient":"niacinamide","pregnancy_safe":true}'::jsonb, false, 'SE'),
('f700000a-0000-4000-a000-000000000004', 'Lyko', 'Bond Repair Hair Mask', 'hair_mask', NULL, NULL, 'mid', '{"concern":["repair"]}'::jsonb, false, 'SE'),
('f700000a-0000-4000-a000-000000000005', 'Lyko', 'Volumising Mascara', 'mascara', 'Black', NULL, 'mid', '{"finish":"volumizing"}'::jsonb, false, 'SE'),

-- ============================================================
-- ETUDE HOUSE (K-beauty)
-- ============================================================
('f8000001-0000-4000-a000-000000000001', 'Etude House', 'Soon Jung 2x Barrier Intensive Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["sensitive","dry"],"concern":["barrier","soothing"],"fragrance_free":true}'::jsonb, false, 'KR'),
('f8000001-0000-4000-a000-000000000002', 'Etude House', 'Soon Jung pH 5.5 Relief Toner', 'toner', NULL, NULL, 'mid', '{"skin_type":["sensitive"],"concern":["soothing","barrier"],"fragrance_free":true}'::jsonb, false, 'KR'),
('f8000001-0000-4000-a000-000000000003', 'Etude House', 'Soon Jung pH 6.5 Whip Cleanser', 'cleanser', NULL, NULL, 'mid', '{"skin_type":["sensitive"],"concern":["gentle cleansing"],"fragrance_free":true}'::jsonb, false, 'KR'),
('f8000001-0000-4000-a000-000000000004', 'Etude House', 'SoonJung Panthensoside Cica Balm', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["sensitive"],"concern":["soothing","repair"],"key_ingredient":"centella"}'::jsonb, false, 'KR'),
('f8000001-0000-4000-a000-000000000005', 'Etude House', 'Wonder Pore Freshner Toner', 'toner', NULL, NULL, 'mid', '{"skin_type":["oily","combination"],"concern":["pores"]}'::jsonb, false, 'KR'),
('f8000001-0000-4000-a000-000000000006', 'Etude House', 'Moistfull Collagen Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["hydration","firming"]}'::jsonb, false, 'KR'),
('f8000001-0000-4000-a000-000000000007', 'Etude House', 'Drawing Eye Brow Pencil', 'brow', 'Dark Brown', NULL, 'budget', '{"finish":"pencil"}'::jsonb, false, 'KR'),
('f8000001-0000-4000-a000-000000000008', 'Etude House', 'Dear Darling Water Gel Tint', 'lipstick', 'Real Red', NULL, 'budget', '{"hex":"#C02828","undertone":"cool","finish":"tint"}'::jsonb, false, 'KR'),

-- ============================================================
-- BANILA CO (K-beauty)
-- ============================================================
('f8000002-0000-4000-a000-000000000001', 'Banila Co', 'Clean It Zero Cleansing Balm Original', 'cleanser', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["makeup removal","deep cleansing"]}'::jsonb, false, 'KR'),
('f8000002-0000-4000-a000-000000000002', 'Banila Co', 'Clean It Zero Cleansing Balm Purifying', 'cleanser', NULL, NULL, 'mid', '{"skin_type":["oily","combination"],"concern":["pores"]}'::jsonb, false, 'KR'),
('f8000002-0000-4000-a000-000000000003', 'Banila Co', 'Clean It Zero Foam Cleanser', 'cleanser', NULL, NULL, 'mid', '{"skin_type":["all"]}'::jsonb, false, 'KR'),
('f8000002-0000-4000-a000-000000000004', 'Banila Co', 'Dear Hydration Brightening Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["hydration","brightening"]}'::jsonb, false, 'KR'),

-- ============================================================
-- KLAIRS (Dear, Klairs)
-- ============================================================
('f8000003-0000-4000-a000-000000000001', 'Klairs', 'Freshly Juiced Vitamin C Serum', 'serum', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["brightening","dark spots"],"key_ingredient":"vitamin c 5%","pregnancy_safe":true}'::jsonb, false, 'KR'),
('f8000003-0000-4000-a000-000000000002', 'Klairs', 'Supple Preparation Facial Toner', 'toner', NULL, NULL, 'mid', '{"skin_type":["sensitive","all"],"concern":["hydration","barrier"],"fragrance_free":true}'::jsonb, false, 'KR'),
('f8000003-0000-4000-a000-000000000003', 'Klairs', 'Rich Moist Foaming Cleanser', 'cleanser', NULL, NULL, 'mid', '{"skin_type":["dry","normal"],"concern":["hydration"]}'::jsonb, false, 'KR'),
('f8000003-0000-4000-a000-000000000004', 'Klairs', 'Midnight Blue Calming Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["sensitive"],"concern":["soothing","redness"]}'::jsonb, false, 'KR'),
('f8000003-0000-4000-a000-000000000005', 'Klairs', 'Fundamental Ampule Mist', 'toner', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["hydration"]}'::jsonb, false, 'KR'),
('f8000003-0000-4000-a000-000000000006', 'Klairs', 'Soft Airy UV Essence SPF50+', 'spf', NULL, NULL, 'mid', '{"spf":50,"skin_type":["sensitive","all"],"finish":"natural"}'::jsonb, false, 'KR'),

-- ============================================================
-- PYUNKANG YUL
-- ============================================================
('f8000004-0000-4000-a000-000000000001', 'Pyunkang Yul', 'Essence Toner', 'toner', NULL, NULL, 'mid', '{"skin_type":["sensitive","all"],"concern":["hydration"],"fragrance_free":true}'::jsonb, false, 'KR'),
('f8000004-0000-4000-a000-000000000002', 'Pyunkang Yul', 'Moisture Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["dry","sensitive"],"concern":["hydration","barrier"],"fragrance_free":true}'::jsonb, false, 'KR'),
('f8000004-0000-4000-a000-000000000003', 'Pyunkang Yul', 'Calming Low pH Cleansing Gel', 'cleanser', NULL, NULL, 'mid', '{"skin_type":["sensitive"],"concern":["gentle cleansing"]}'::jsonb, false, 'KR'),
('f8000004-0000-4000-a000-000000000004', 'Pyunkang Yul', 'ATO Cream Blue Label', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["very dry","sensitive"],"concern":["barrier"],"fragrance_free":true}'::jsonb, false, 'KR'),

-- ============================================================
-- TORRIDEN
-- ============================================================
('f8000005-0000-4000-a000-000000000001', 'Torriden', 'DIVE-IN Low Molecular Hyaluronic Acid Serum', 'serum', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["hydration"],"key_ingredient":"hyaluronic acid","pregnancy_safe":true,"fragrance_free":true}'::jsonb, false, 'KR'),
('f8000005-0000-4000-a000-000000000002', 'Torriden', 'DIVE-IN Low Molecular Hyaluronic Acid Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["hydration"],"fragrance_free":true}'::jsonb, false, 'KR'),
('f8000005-0000-4000-a000-000000000003', 'Torriden', 'BALANCEFUL Cica Toner', 'toner', NULL, NULL, 'mid', '{"skin_type":["sensitive","all"],"concern":["soothing"],"key_ingredient":"centella"}'::jsonb, false, 'KR'),

-- ============================================================
-- MEDIHEAL
-- ============================================================
('f8000006-0000-4000-a000-000000000001', 'Mediheal', 'Tea Tree Care Solution Essential Mask', 'mask', NULL, NULL, 'budget', '{"skin_type":["oily","acne-prone"],"concern":["acne","soothing"],"key_ingredient":"tea tree"}'::jsonb, false, 'KR'),
('f8000006-0000-4000-a000-000000000002', 'Mediheal', 'NMF Aquaring Ampoule Mask', 'mask', NULL, NULL, 'budget', '{"skin_type":["dry","all"],"concern":["hydration"]}'::jsonb, false, 'KR'),
('f8000006-0000-4000-a000-000000000003', 'Mediheal', 'Vita Lightbeam Essential Mask', 'mask', NULL, NULL, 'budget', '{"skin_type":["all"],"concern":["brightening"],"key_ingredient":"vitamin c"}'::jsonb, false, 'KR'),
('f8000006-0000-4000-a000-000000000004', 'Mediheal', 'Collagen Impact Essential Mask', 'mask', NULL, NULL, 'budget', '{"skin_type":["mature","all"],"concern":["firming"]}'::jsonb, false, 'KR'),

-- ============================================================
-- MIZON
-- ============================================================
('f8000007-0000-4000-a000-000000000001', 'Mizon', 'All In One Snail Repair Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["repair","hydration"],"key_ingredient":"snail mucin"}'::jsonb, false, 'KR'),
('f8000007-0000-4000-a000-000000000002', 'Mizon', 'Snail Repair Intensive Ampoule', 'serum', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["repair"],"key_ingredient":"snail mucin"}'::jsonb, false, 'KR'),
('f8000007-0000-4000-a000-000000000003', 'Mizon', 'Collagen Power Lifting Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["mature"],"concern":["firming","anti-aging"]}'::jsonb, false, 'KR'),

-- ============================================================
-- PURITO
-- ============================================================
('f8000008-0000-4000-a000-000000000001', 'Purito', 'Centella Green Level Buffet Serum', 'serum', NULL, NULL, 'mid', '{"skin_type":["sensitive","all"],"concern":["soothing"],"key_ingredient":"centella"}'::jsonb, false, 'KR'),
('f8000008-0000-4000-a000-000000000002', 'Purito', 'Daily Go-To Sunscreen SPF50+', 'spf', NULL, NULL, 'mid', '{"spf":50,"skin_type":["all"],"finish":"natural"}'::jsonb, false, 'KR'),
('f8000008-0000-4000-a000-000000000003', 'Purito', 'Defence Barrier Ph Cleanser', 'cleanser', NULL, NULL, 'mid', '{"skin_type":["sensitive","all"],"concern":["barrier"]}'::jsonb, false, 'KR'),
('f8000008-0000-4000-a000-000000000004', 'Purito', 'Dermide Cica Barrier Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["sensitive","dry"],"concern":["barrier","soothing"]}'::jsonb, false, 'KR'),

-- ============================================================
-- COSRX (additional)
-- ============================================================
('f8000009-0000-4000-a000-000000000001', 'COSRX', 'Advanced Snail 92 All In One Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["repair","hydration"],"key_ingredient":"snail mucin"}'::jsonb, false, 'KR'),
('f8000009-0000-4000-a000-000000000002', 'COSRX', 'Acne Pimple Master Patch', 'other', NULL, NULL, 'budget', '{"concern":["acne","spot treatment"]}'::jsonb, false, 'KR'),
('f8000009-0000-4000-a000-000000000003', 'COSRX', 'BHA Blackhead Power Liquid', 'toner', NULL, NULL, 'mid', '{"skin_type":["oily","combination"],"concern":["pores","blackheads"],"key_ingredient":"BHA"}'::jsonb, false, 'KR'),
('f8000009-0000-4000-a000-000000000004', 'COSRX', 'AHA 7 Whitehead Power Liquid', 'toner', NULL, NULL, 'mid', '{"skin_type":["combination","all"],"concern":["texture","whiteheads"],"key_ingredient":"AHA"}'::jsonb, false, 'KR'),
('f8000009-0000-4000-a000-000000000005', 'COSRX', 'The Retinol 0.1 Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["anti-aging"],"key_ingredient":"retinol 0.1%","pregnancy_safe":false}'::jsonb, false, 'KR'),
('f8000009-0000-4000-a000-000000000006', 'COSRX', 'Vitamin C 23 Serum', 'serum', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["brightening","dark spots"],"key_ingredient":"vitamin c 23%"}'::jsonb, false, 'KR'),
('f8000009-0000-4000-a000-000000000007', 'COSRX', 'Centella Blemish Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["sensitive","acne-prone"],"concern":["soothing","acne"],"key_ingredient":"centella"}'::jsonb, false, 'KR'),
('f8000009-0000-4000-a000-000000000008', 'COSRX', 'Aloe Soothing Sun Cream SPF50', 'spf', NULL, NULL, 'mid', '{"spf":50,"skin_type":["sensitive","all"],"finish":"natural"}'::jsonb, false, 'KR'),

-- ============================================================
-- BEAUTY OF JOSEON (additional)
-- ============================================================
('f800000a-0000-4000-a000-000000000001', 'Beauty of Joseon', 'Glow Deep Serum Rice + Alpha Arbutin', 'serum', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["brightening","dark spots"]}'::jsonb, false, 'KR'),
('f800000a-0000-4000-a000-000000000002', 'Beauty of Joseon', 'Calming Serum Green Tea + Panthenol', 'serum', NULL, NULL, 'mid', '{"skin_type":["sensitive"],"concern":["soothing"],"key_ingredient":"green tea"}'::jsonb, false, 'KR'),
('f800000a-0000-4000-a000-000000000003', 'Beauty of Joseon', 'Glow Replenishing Rice Milk', 'toner', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["hydration","brightening"],"key_ingredient":"rice"}'::jsonb, false, 'KR'),
('f800000a-0000-4000-a000-000000000004', 'Beauty of Joseon', 'Red Bean Refreshing Pore Mask', 'mask', NULL, NULL, 'mid', '{"skin_type":["oily","combination"],"concern":["pores"]}'::jsonb, false, 'KR'),

-- ============================================================
-- ANUA (additional)
-- ============================================================
('f800000b-0000-4000-a000-000000000001', 'ANUA', 'Heartleaf Pore Control Cleansing Oil', 'cleanser', NULL, NULL, 'mid', '{"skin_type":["oily","combination"],"concern":["pores","deep cleansing"],"key_ingredient":"heartleaf"}'::jsonb, false, 'KR'),
('f800000b-0000-4000-a000-000000000002', 'ANUA', 'Heartleaf Soothing Toner Pad', 'toner', NULL, NULL, 'mid', '{"skin_type":["sensitive"],"concern":["soothing"]}'::jsonb, false, 'KR'),
('f800000b-0000-4000-a000-000000000003', 'ANUA', 'Niacinamide 10 + TXA 4 Serum', 'serum', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["brightening","pores"],"key_ingredient":"niacinamide 10%"}'::jsonb, false, 'KR'),

-- ============================================================
-- BABOR
-- ============================================================
('f9000001-0000-4000-a000-000000000001', 'Babor', 'Skinovage Vitalizing Cream', 'moisturizer', NULL, NULL, 'premium', '{"skin_type":["tired","mature"],"concern":["radiance","anti-aging"]}'::jsonb, false, 'DE'),
('f9000001-0000-4000-a000-000000000002', 'Babor', 'Doctor Babor Hyaluronic Acid Concentrate', 'serum', NULL, NULL, 'premium', '{"skin_type":["all"],"concern":["hydration"],"key_ingredient":"hyaluronic acid"}'::jsonb, false, 'DE'),
('f9000001-0000-4000-a000-000000000003', 'Babor', 'Doctor Babor Lift Cellular Serum', 'serum', NULL, NULL, 'premium', '{"skin_type":["mature"],"concern":["firming","anti-aging"]}'::jsonb, false, 'DE'),
('f9000001-0000-4000-a000-000000000004', 'Babor', 'Cleansing CP Phytoactive Sensitive', 'cleanser', NULL, NULL, 'premium', '{"skin_type":["sensitive"],"concern":["gentle cleansing"]}'::jsonb, false, 'DE'),
('f9000001-0000-4000-a000-000000000005', 'Babor', 'Ampoule Concentrates Hydration Plus', 'serum', NULL, NULL, 'premium', '{"skin_type":["dry"],"concern":["hydration"]}'::jsonb, false, 'DE'),
('f9000001-0000-4000-a000-000000000006', 'Babor', 'Reversive Pro Youth Cream', 'moisturizer', NULL, NULL, 'premium', '{"skin_type":["mature"],"concern":["anti-aging"]}'::jsonb, false, 'DE'),

-- ============================================================
-- DERMALOGICA
-- ============================================================
('f9000002-0000-4000-a000-000000000001', 'Dermalogica', 'Special Cleansing Gel', 'cleanser', NULL, NULL, 'premium', '{"skin_type":["all"],"vegan":true}'::jsonb, false, 'US'),
('f9000002-0000-4000-a000-000000000002', 'Dermalogica', 'Daily Microfoliant', 'exfoliant', NULL, NULL, 'premium', '{"skin_type":["all"],"concern":["texture","brightening"]}'::jsonb, false, 'US'),
('f9000002-0000-4000-a000-000000000003', 'Dermalogica', 'Active Moist', 'moisturizer', NULL, NULL, 'premium', '{"skin_type":["oily","normal"],"concern":["hydration"]}'::jsonb, false, 'US'),
('f9000002-0000-4000-a000-000000000004', 'Dermalogica', 'Age Smart Skin Resurfacing Cleanser', 'cleanser', NULL, NULL, 'premium', '{"skin_type":["mature"],"concern":["anti-aging","texture"]}'::jsonb, false, 'US'),
('f9000002-0000-4000-a000-000000000005', 'Dermalogica', 'Phyto Replenish Oil', 'serum', NULL, NULL, 'premium', '{"skin_type":["dry","mature"],"concern":["nourishing","face oil"]}'::jsonb, false, 'US'),
('f9000002-0000-4000-a000-000000000006', 'Dermalogica', 'BioLumin-C Serum', 'serum', NULL, NULL, 'premium', '{"skin_type":["all"],"concern":["brightening"],"key_ingredient":"vitamin c"}'::jsonb, false, 'US'),
('f9000002-0000-4000-a000-000000000007', 'Dermalogica', 'Multivitamin Power Firm Eye Cream', 'eye_cream', NULL, NULL, 'premium', '{"concern":["anti-aging","firming"]}'::jsonb, false, 'US'),
('f9000002-0000-4000-a000-000000000008', 'Dermalogica', 'Pure Light SPF50', 'spf', NULL, NULL, 'premium', '{"spf":50,"concern":["brightening","protection"]}'::jsonb, false, 'US'),

-- ============================================================
-- IS CLINICAL
-- ============================================================
('f9000003-0000-4000-a000-000000000001', 'iS Clinical', 'Active Serum', 'serum', NULL, NULL, 'luxury', '{"skin_type":["all"],"concern":["anti-aging","texture"]}'::jsonb, false, 'US'),
('f9000003-0000-4000-a000-000000000002', 'iS Clinical', 'Pro-Heal Serum Advance Plus', 'serum', NULL, NULL, 'luxury', '{"skin_type":["sensitive","acne-prone"],"concern":["repair","brightening"],"pregnancy_safe":true}'::jsonb, false, 'US'),
('f9000003-0000-4000-a000-000000000003', 'iS Clinical', 'Cleansing Complex', 'cleanser', NULL, NULL, 'luxury', '{"skin_type":["all"]}'::jsonb, false, 'US'),
('f9000003-0000-4000-a000-000000000004', 'iS Clinical', 'Eclipse SPF50+', 'spf', NULL, NULL, 'luxury', '{"spf":50,"finish":"tinted","skin_type":["all"]}'::jsonb, false, 'US'),

-- ============================================================
-- FILORGA
-- ============================================================
('f9000004-0000-4000-a000-000000000001', 'Filorga', 'NCEF-Intensive Multi-Correction Serum', 'serum', NULL, NULL, 'premium', '{"skin_type":["mature","all"],"concern":["anti-aging"]}'::jsonb, false, 'FR'),
('f9000004-0000-4000-a000-000000000002', 'Filorga', 'Time-Filler 5XP Cream', 'moisturizer', NULL, NULL, 'premium', '{"skin_type":["mature"],"concern":["anti-aging","wrinkles"]}'::jsonb, false, 'FR'),
('f9000004-0000-4000-a000-000000000003', 'Filorga', 'Hydra-Hyal Hydrating Plumping Serum', 'serum', NULL, NULL, 'premium', '{"skin_type":["all"],"concern":["hydration"],"key_ingredient":"hyaluronic acid"}'::jsonb, false, 'FR'),
('f9000004-0000-4000-a000-000000000004', 'Filorga', 'Optim-Eyes Eye Contour Cream', 'eye_cream', NULL, NULL, 'premium', '{"concern":["dark circles","puffiness","anti-aging"]}'::jsonb, false, 'FR'),
('f9000004-0000-4000-a000-000000000005', 'Filorga', 'Anti-Ageing Micellar Solution', 'cleanser', NULL, NULL, 'premium', '{"skin_type":["mature"],"concern":["anti-aging","makeup removal"]}'::jsonb, false, 'FR'),

-- ============================================================
-- ESTHEDERM
-- ============================================================
('f9000005-0000-4000-a000-000000000001', 'Institut Esthederm', 'Cellular Water Spray', 'toner', NULL, NULL, 'premium', '{"skin_type":["all"],"concern":["hydration"]}'::jsonb, false, 'FR'),
('f9000005-0000-4000-a000-000000000002', 'Institut Esthederm', 'Intensive Hyaluronic Serum', 'serum', NULL, NULL, 'premium', '{"skin_type":["all"],"concern":["hydration"],"key_ingredient":"hyaluronic acid"}'::jsonb, false, 'FR'),
('f9000005-0000-4000-a000-000000000003', 'Institut Esthederm', 'Sun Sheen Bronzing Drops', 'self_tanner', NULL, NULL, 'premium', '{"concern":["tanning"]}'::jsonb, false, 'FR'),
('f9000005-0000-4000-a000-000000000004', 'Institut Esthederm', 'Adaptasun Body Lotion Strong Sun', 'spf', NULL, NULL, 'premium', '{"spf":50,"skin_type":["all"]}'::jsonb, false, 'FR'),

-- ============================================================
-- IMAGE SKINCARE
-- ============================================================
('f9000006-0000-4000-a000-000000000001', 'Image Skincare', 'Vital C Hydrating Anti-Aging Serum', 'serum', NULL, NULL, 'premium', '{"skin_type":["all"],"concern":["anti-aging","brightening"],"key_ingredient":"vitamin c"}'::jsonb, false, 'US'),
('f9000006-0000-4000-a000-000000000002', 'Image Skincare', 'Vital C Hydrating Facial Cleanser', 'cleanser', NULL, NULL, 'premium', '{"skin_type":["dry","all"],"concern":["hydration"]}'::jsonb, false, 'US'),
('f9000006-0000-4000-a000-000000000003', 'Image Skincare', 'AGELESS Total Repair Crème', 'moisturizer', NULL, NULL, 'premium', '{"skin_type":["mature"],"concern":["anti-aging"]}'::jsonb, false, 'US'),
('f9000006-0000-4000-a000-000000000004', 'Image Skincare', 'Prevention+ Daily Tinted Moisturizer SPF30', 'spf', NULL, NULL, 'premium', '{"spf":30,"finish":"tinted","skin_type":["all"]}'::jsonb, false, 'US'),

-- ============================================================
-- OLAY
-- ============================================================
('fa000001-0000-4000-a000-000000000001', 'Olay', 'Regenerist Micro-Sculpting Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["mature","all"],"concern":["anti-aging","firming"]}'::jsonb, false, 'US'),
('fa000001-0000-4000-a000-000000000002', 'Olay', 'Regenerist Retinol24 Night Moisturiser', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["anti-aging"],"key_ingredient":"retinol","pregnancy_safe":false}'::jsonb, false, 'US'),
('fa000001-0000-4000-a000-000000000003', 'Olay', 'Total Effects 7-in-1 Anti-Aging Day Cream SPF15', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["mature","all"],"concern":["anti-aging"],"spf":15}'::jsonb, false, 'US'),
('fa000001-0000-4000-a000-000000000004', 'Olay', 'Hyaluronic Acid + Peptide 24 Serum', 'serum', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["hydration"],"key_ingredient":"hyaluronic acid"}'::jsonb, false, 'US'),
('fa000001-0000-4000-a000-000000000005', 'Olay', 'Foaming Face Wash with Vitamin B3', 'cleanser', NULL, NULL, 'mid', '{"skin_type":["all"]}'::jsonb, false, 'US'),
('fa000001-0000-4000-a000-000000000006', 'Olay', 'Eyes Brightening Eye Cream', 'eye_cream', NULL, NULL, 'mid', '{"concern":["brightening","dark circles"]}'::jsonb, false, 'US'),

-- ============================================================
-- POND'S
-- ============================================================
('fa000002-0000-4000-a000-000000000001', 'Pond''s', 'Bright Beauty Cream', 'moisturizer', NULL, NULL, 'budget', '{"skin_type":["all"],"concern":["brightening"]}'::jsonb, false, 'NL'),
('fa000002-0000-4000-a000-000000000002', 'Pond''s', 'Cold Cream Cleanser', 'cleanser', NULL, NULL, 'budget', '{"skin_type":["dry","mature"]}'::jsonb, false, 'NL'),
('fa000002-0000-4000-a000-000000000003', 'Pond''s', 'Rejuveness Anti-Wrinkle Cream', 'moisturizer', NULL, NULL, 'budget', '{"skin_type":["mature"],"concern":["anti-aging"]}'::jsonb, false, 'NL'),
('fa000002-0000-4000-a000-000000000004', 'Pond''s', 'Daily Hydrating Lotion', 'body_lotion', NULL, NULL, 'budget', '{"concern":["hydration"]}'::jsonb, false, 'NL'),

-- ============================================================
-- A-DERMA
-- ============================================================
('fa000003-0000-4000-a000-000000000001', 'A-Derma', 'Phys-AC Foaming Gel Cleanser', 'cleanser', NULL, NULL, 'mid', '{"skin_type":["oily","acne-prone"],"concern":["acne"],"fragrance_free":true}'::jsonb, false, 'FR'),
('fa000003-0000-4000-a000-000000000002', 'A-Derma', 'Dermalibour+ Repairing Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["sensitive","damaged"],"concern":["repair","barrier"],"fragrance_free":true}'::jsonb, false, 'FR'),
('fa000003-0000-4000-a000-000000000003', 'A-Derma', 'Exomega Control Emollient Cream', 'body_cream', NULL, NULL, 'mid', '{"skin_type":["eczema-prone","very dry"],"concern":["barrier"],"fragrance_free":true}'::jsonb, false, 'FR'),

-- ============================================================
-- BRIOGEO
-- ============================================================
('fb000001-0000-4000-a000-000000000001', 'Briogeo', 'Don''t Despair Repair Deep Conditioning Mask', 'hair_mask', NULL, NULL, 'premium', '{"concern":["repair","hydration"]}'::jsonb, false, 'US'),
('fb000001-0000-4000-a000-000000000002', 'Briogeo', 'Be Gentle Be Kind Aloe + Oat Milk Shampoo', 'shampoo', NULL, NULL, 'premium', '{"concern":["gentle","sensitive scalp"]}'::jsonb, false, 'US'),
('fb000001-0000-4000-a000-000000000003', 'Briogeo', 'Scalp Revival Charcoal + Coconut Oil Micro-Exfoliating Shampoo', 'shampoo', NULL, NULL, 'premium', '{"concern":["scalp","exfoliation"]}'::jsonb, false, 'US'),
('fb000001-0000-4000-a000-000000000004', 'Briogeo', 'Curl Charisma Rice Amino + Avocado Hydrating Curl Defining Cream', 'hair_treatment', NULL, NULL, 'premium', '{"concern":["curl definition","hydration"]}'::jsonb, false, 'US'),
('fb000001-0000-4000-a000-000000000005', 'Briogeo', 'Farewell Frizz Smoothing Shampoo', 'shampoo', NULL, NULL, 'premium', '{"concern":["frizz","smoothing"]}'::jsonb, false, 'US'),

-- ============================================================
-- ORIBE
-- ============================================================
('fb000002-0000-4000-a000-000000000001', 'Oribe', 'Gold Lust Repair & Restore Shampoo', 'shampoo', NULL, NULL, 'luxury', '{"concern":["repair"]}'::jsonb, false, 'US'),
('fb000002-0000-4000-a000-000000000002', 'Oribe', 'Gold Lust Nourishing Hair Oil', 'hair_oil', NULL, NULL, 'luxury', '{"concern":["nourishing","shine"]}'::jsonb, false, 'US'),
('fb000002-0000-4000-a000-000000000003', 'Oribe', 'Dry Texturizing Spray', 'hair_treatment', NULL, NULL, 'luxury', '{"concern":["volume","texture"]}'::jsonb, false, 'US'),
('fb000002-0000-4000-a000-000000000004', 'Oribe', 'Imperial Blowout Transformative Styling Crème', 'hair_treatment', NULL, NULL, 'luxury', '{"concern":["heat protection","smoothing"]}'::jsonb, false, 'US'),
('fb000002-0000-4000-a000-000000000005', 'Oribe', 'Signature Conditioner', 'conditioner', NULL, NULL, 'luxury', '{"concern":["softness"]}'::jsonb, false, 'US'),

-- ============================================================
-- LIVING PROOF
-- ============================================================
('fb000003-0000-4000-a000-000000000001', 'Living Proof', 'Perfect Hair Day Dry Shampoo', 'dry_shampoo', NULL, NULL, 'premium', '{}'::jsonb, false, 'US'),
('fb000003-0000-4000-a000-000000000002', 'Living Proof', 'No Frizz Nourishing Styling Cream', 'hair_treatment', NULL, NULL, 'premium', '{"concern":["frizz","nourishing"]}'::jsonb, false, 'US'),
('fb000003-0000-4000-a000-000000000003', 'Living Proof', 'Restore Repair Mask', 'hair_mask', NULL, NULL, 'premium', '{"concern":["repair"]}'::jsonb, false, 'US'),
('fb000003-0000-4000-a000-000000000004', 'Living Proof', 'Full Thickening Mousse', 'hair_treatment', NULL, NULL, 'premium', '{"concern":["volume"]}'::jsonb, false, 'US'),

-- ============================================================
-- BUMBLE AND BUMBLE
-- ============================================================
('fb000004-0000-4000-a000-000000000001', 'Bumble and bumble', 'Hairdresser''s Invisible Oil Shampoo', 'shampoo', NULL, NULL, 'premium', '{"concern":["softness","smoothing"]}'::jsonb, false, 'US'),
('fb000004-0000-4000-a000-000000000002', 'Bumble and bumble', 'Hairdresser''s Invisible Oil Conditioner', 'conditioner', NULL, NULL, 'premium', '{"concern":["softness","smoothing"]}'::jsonb, false, 'US'),
('fb000004-0000-4000-a000-000000000003', 'Bumble and bumble', 'Surf Spray', 'hair_treatment', NULL, NULL, 'premium', '{"concern":["texture","beachy"]}'::jsonb, false, 'US'),
('fb000004-0000-4000-a000-000000000004', 'Bumble and bumble', 'Thickening Volume Shampoo', 'shampoo', NULL, NULL, 'premium', '{"concern":["volume"]}'::jsonb, false, 'US'),
('fb000004-0000-4000-a000-000000000005', 'Bumble and bumble', 'Thickening Dryspun Texture Spray', 'hair_treatment', NULL, NULL, 'premium', '{"concern":["volume","texture"]}'::jsonb, false, 'US'),

-- ============================================================
-- DAVINES
-- ============================================================
('fb000005-0000-4000-a000-000000000001', 'Davines', 'OI Shampoo', 'shampoo', NULL, NULL, 'premium', '{"concern":["softness","shine"]}'::jsonb, false, 'IT'),
('fb000005-0000-4000-a000-000000000002', 'Davines', 'OI Conditioner', 'conditioner', NULL, NULL, 'premium', '{"concern":["softness","shine"]}'::jsonb, false, 'IT'),
('fb000005-0000-4000-a000-000000000003', 'Davines', 'OI All In One Milk', 'hair_treatment', NULL, NULL, 'premium', '{"concern":["multi-benefit","smoothing"]}'::jsonb, false, 'IT'),
('fb000005-0000-4000-a000-000000000004', 'Davines', 'Love Smoothing Shampoo', 'shampoo', NULL, NULL, 'premium', '{"concern":["smoothing","frizz"]}'::jsonb, false, 'IT'),
('fb000005-0000-4000-a000-000000000005', 'Davines', 'NaturalTech Nourishing Vegetarian Miracle Conditioner', 'conditioner', NULL, NULL, 'premium', '{"concern":["nourishing"],"vegan":true}'::jsonb, false, 'IT'),

-- ============================================================
-- ADDITIONAL VICHY / LA ROCHE-POSAY / AVENE / BIODERMA
-- ============================================================
('fc000001-0000-4000-a000-000000000001', 'Vichy', 'Liftactiv Vitamin C Brightening Skin Corrector', 'serum', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["brightening","anti-aging"],"key_ingredient":"vitamin c 15%","pregnancy_safe":true}'::jsonb, false, 'FR'),
('fc000001-0000-4000-a000-000000000002', 'Vichy', 'Neovadiol Peri-Menopause Day Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["mature"],"concern":["anti-aging","firming"]}'::jsonb, false, 'FR'),
('fc000001-0000-4000-a000-000000000003', 'Vichy', 'Liftactiv H.A. Anti-Wrinkle Filler', 'serum', NULL, NULL, 'mid', '{"skin_type":["mature"],"concern":["anti-aging","wrinkles"],"key_ingredient":"hyaluronic acid"}'::jsonb, false, 'FR'),

('fc000002-0000-4000-a000-000000000001', 'La Roche-Posay', 'Retinol B3 Pure Retinol Serum', 'serum', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["anti-aging","texture"],"key_ingredient":"retinol","pregnancy_safe":false,"fragrance_free":true}'::jsonb, false, 'FR'),
('fc000002-0000-4000-a000-000000000002', 'La Roche-Posay', 'Effaclar Duo+ M', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["oily","acne-prone"],"concern":["acne","pores"]}'::jsonb, false, 'FR'),
('fc000002-0000-4000-a000-000000000003', 'La Roche-Posay', 'Substiane Riche Replenishing Care', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["mature","dry"],"concern":["anti-aging","hydration"]}'::jsonb, false, 'FR'),
('fc000002-0000-4000-a000-000000000004', 'La Roche-Posay', 'Toleriane Sensitive Riche', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["sensitive","dry"],"concern":["soothing","hydration"],"fragrance_free":true}'::jsonb, false, 'FR'),

('fc000003-0000-4000-a000-000000000001', 'Avène', 'Hydrance Aqua-Gel', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["normal","combination"],"concern":["hydration"]}'::jsonb, false, 'FR'),
('fc000003-0000-4000-a000-000000000002', 'Avène', 'A-Oxitive Smoothing Eye Contour Cream', 'eye_cream', NULL, NULL, 'mid', '{"concern":["anti-aging","brightening"]}'::jsonb, false, 'FR'),
('fc000003-0000-4000-a000-000000000003', 'Avène', 'Thermal Spring Water Spray', 'toner', NULL, NULL, 'budget', '{"skin_type":["sensitive","all"],"concern":["soothing"]}'::jsonb, false, 'FR'),
('fc000003-0000-4000-a000-000000000004', 'Avène', 'Antirougeurs Day Soothing Cream', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["sensitive"],"concern":["redness","soothing"]}'::jsonb, false, 'FR'),

('fc000004-0000-4000-a000-000000000001', 'Bioderma', 'Atoderm Intensive Baume', 'body_cream', NULL, NULL, 'mid', '{"skin_type":["very dry","eczema-prone"],"concern":["barrier"],"fragrance_free":true}'::jsonb, false, 'FR'),
('fc000004-0000-4000-a000-000000000002', 'Bioderma', 'Hydrabio Serum', 'serum', NULL, NULL, 'mid', '{"skin_type":["dehydrated","all"],"concern":["hydration"]}'::jsonb, false, 'FR'),
('fc000004-0000-4000-a000-000000000003', 'Bioderma', 'Pigmentbio C-Concentrate', 'serum', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["dark spots","brightening"],"key_ingredient":"vitamin c"}'::jsonb, false, 'FR'),
('fc000004-0000-4000-a000-000000000004', 'Bioderma', 'Hydrabio Tonique', 'toner', NULL, NULL, 'mid', '{"skin_type":["dehydrated"],"concern":["hydration"]}'::jsonb, false, 'FR'),

-- ============================================================
-- ADDITIONAL GARNIER / NIVEA
-- ============================================================
('fc000005-0000-4000-a000-000000000001', 'Garnier', 'Bio Honey Flower Repairing Day Cream', 'moisturizer', NULL, NULL, 'budget', '{"skin_type":["dry"],"concern":["repair"],"natural":true}'::jsonb, false, 'FR'),
('fc000005-0000-4000-a000-000000000002', 'Garnier', 'Skin Active Moisture+ Aqua Bomb Tissue Mask', 'mask', NULL, NULL, 'budget', '{"skin_type":["dehydrated","all"],"concern":["hydration"]}'::jsonb, false, 'FR'),
('fc000005-0000-4000-a000-000000000003', 'Garnier', 'Skin Active Micellar Cleansing Water Oily Skin', 'cleanser', NULL, NULL, 'budget', '{"skin_type":["oily","combination"]}'::jsonb, false, 'FR'),
('fc000005-0000-4000-a000-000000000004', 'Garnier', 'Ambre Solaire Anti-Age Super UV Face Cream SPF50', 'spf', NULL, NULL, 'budget', '{"spf":50,"concern":["anti-aging","protection"]}'::jsonb, false, 'FR'),
('fc000005-0000-4000-a000-000000000005', 'Garnier', 'Fructis SOS Repair Conditioner', 'conditioner', NULL, NULL, 'budget', '{"concern":["repair"]}'::jsonb, false, 'FR'),

('fc000006-0000-4000-a000-000000000001', 'Nivea', 'Q10 Power Anti-Wrinkle Day Cream SPF15', 'moisturizer', NULL, NULL, 'budget', '{"skin_type":["mature"],"concern":["anti-aging"],"spf":15}'::jsonb, false, 'DE'),
('fc000006-0000-4000-a000-000000000002', 'Nivea', 'Q10 Power Anti-Wrinkle Night Cream', 'moisturizer', NULL, NULL, 'budget', '{"skin_type":["mature"],"concern":["anti-aging"]}'::jsonb, false, 'DE'),
('fc000006-0000-4000-a000-000000000003', 'Nivea', 'Hyaluron Cellular Filler Eye Cream', 'eye_cream', NULL, NULL, 'budget', '{"concern":["anti-aging","hydration"]}'::jsonb, false, 'DE'),
('fc000006-0000-4000-a000-000000000004', 'Nivea', 'Naturally Good Bio Aloe Vera Body Lotion', 'body_lotion', NULL, NULL, 'budget', '{"concern":["soothing","hydration"]}'::jsonb, false, 'DE'),

-- ============================================================
-- RITUALS (additional)
-- ============================================================
('fd000001-0000-4000-a000-000000000001', 'Rituals', 'The Ritual of Mehr Body Cream', 'body_cream', NULL, NULL, 'premium', '{"concern":["hydration"]}'::jsonb, false, 'NL'),
('fd000001-0000-4000-a000-000000000002', 'Rituals', 'The Ritual of Karma Shower Oil', 'body_wash', NULL, NULL, 'premium', '{"concern":["nourishing"]}'::jsonb, false, 'NL'),
('fd000001-0000-4000-a000-000000000003', 'Rituals', 'The Ritual of Namaste Glow Anti-Ageing Serum', 'serum', NULL, NULL, 'premium', '{"skin_type":["mature"],"concern":["anti-aging","glow"]}'::jsonb, false, 'NL'),
('fd000001-0000-4000-a000-000000000004', 'Rituals', 'The Ritual of Namaste Hydrating Day Cream', 'moisturizer', NULL, NULL, 'premium', '{"skin_type":["normal","dry"],"concern":["hydration"]}'::jsonb, false, 'NL'),
('fd000001-0000-4000-a000-000000000005', 'Rituals', 'The Ritual of Karma Soothing Hand Wash', 'body_wash', NULL, NULL, 'premium', '{"concern":["soothing"]}'::jsonb, false, 'NL'),
('fd000001-0000-4000-a000-000000000006', 'Rituals', 'The Ritual of Sakura Hair & Body Mist', 'fragrance', NULL, NULL, 'premium', '{"family":"floral fresh"}'::jsonb, false, 'NL'),

-- ============================================================
-- SOL DE JANEIRO (additional)
-- ============================================================
('fd000002-0000-4000-a000-000000000001', 'Sol de Janeiro', 'Brazilian Crush Cheirosa 62 Body Mist', 'fragrance', NULL, NULL, 'premium', '{"family":"warm gourmand"}'::jsonb, false, 'BR'),
('fd000002-0000-4000-a000-000000000002', 'Sol de Janeiro', 'Brazilian 4 Play Body Wash', 'body_wash', NULL, NULL, 'premium', '{"concern":["hydration"]}'::jsonb, false, 'BR'),
('fd000002-0000-4000-a000-000000000003', 'Sol de Janeiro', 'Bom Dia Bright Cream', 'body_cream', NULL, NULL, 'premium', '{"concern":["brightening","firming"]}'::jsonb, false, 'BR'),
('fd000002-0000-4000-a000-000000000004', 'Sol de Janeiro', 'Sol Cheirosa 71 Perfume Mist', 'fragrance', NULL, NULL, 'premium', '{"family":"floral gourmand"}'::jsonb, false, 'BR'),

-- ============================================================
-- AVEENO BODY
-- ============================================================
('fd000003-0000-4000-a000-000000000001', 'Aveeno', 'Skin Relief Moisturising Lotion', 'body_lotion', NULL, NULL, 'mid', '{"skin_type":["very dry","sensitive"],"concern":["barrier","soothing"],"fragrance_free":true}'::jsonb, false, 'US'),
('fd000003-0000-4000-a000-000000000002', 'Aveeno', 'Daily Moisturising Body Yogurt', 'body_lotion', NULL, NULL, 'mid', '{"skin_type":["dry"],"concern":["hydration"]}'::jsonb, false, 'US'),
('fd000003-0000-4000-a000-000000000003', 'Aveeno', 'Positively Radiant Daily Facial Moisturiser SPF30', 'moisturizer', NULL, NULL, 'mid', '{"skin_type":["all"],"concern":["brightening","protection"],"spf":30}'::jsonb, false, 'US'),

-- ============================================================
-- E45 / DECUBAL / LOCOBASE / EUCERIN (additional)
-- ============================================================
('fd000004-0000-4000-a000-000000000001', 'E45', 'Itch Relief Cream', 'body_cream', NULL, NULL, 'budget', '{"skin_type":["very dry","eczema-prone"],"concern":["itch","barrier"],"fragrance_free":true}'::jsonb, false, 'GB'),
('fd000004-0000-4000-a000-000000000002', 'Decubal', 'Body Cream', 'body_cream', NULL, NULL, 'budget', '{"skin_type":["very dry","sensitive"],"concern":["barrier"],"fragrance_free":true}'::jsonb, false, 'DK'),
('fd000004-0000-4000-a000-000000000003', 'Locobase', 'Lipid Repair Cream', 'body_cream', NULL, NULL, 'budget', '{"skin_type":["very dry","eczema-prone"],"concern":["barrier","repair"],"fragrance_free":true}'::jsonb, false, 'DK'),
('fd000004-0000-4000-a000-000000000004', 'Eucerin', 'AtopiControl Body Care Lotion', 'body_lotion', NULL, NULL, 'mid', '{"skin_type":["eczema-prone","very dry"],"concern":["barrier"],"fragrance_free":true}'::jsonb, false, 'DE'),
('fd000004-0000-4000-a000-000000000005', 'Eucerin', 'UreaRepair Plus 10% Urea Lotion', 'body_lotion', NULL, NULL, 'mid', '{"skin_type":["very dry"],"concern":["barrier","hydration"]}'::jsonb, false, 'DE'),
('fd000004-0000-4000-a000-000000000006', 'Eucerin', 'Hyaluron-Filler Sun Fluid SPF50+', 'spf', NULL, NULL, 'mid', '{"spf":50,"skin_type":["mature","all"],"concern":["anti-aging","protection"]}'::jsonb, false, 'DE')

on conflict (id) do nothing;
