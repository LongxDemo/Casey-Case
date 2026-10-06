-- Casey — seed the catalog to match the app's bundled defaults.
-- Run after schema.sql.

insert into phone_models (id, brand, name, aspect, camera, sort) values
  ('ip17pm','iPhone','17 Pro Max',0.46,'{"x":0.05,"y":0.04,"w":0.36,"h":0.26}',0),
  ('ip17p','iPhone','17 Pro',0.46,'{"x":0.05,"y":0.04,"w":0.36,"h":0.26}',1),
  ('ip17air','iPhone','Air',0.48,'{"x":0.05,"y":0.04,"w":0.3,"h":0.2}',2),
  ('ip17','iPhone','17',0.47,'{"x":0.05,"y":0.04,"w":0.3,"h":0.2}',3),
  ('ip16pm','iPhone','16 Pro Max',0.46,'{"x":0.05,"y":0.04,"w":0.36,"h":0.26}',4),
  ('ip16p','iPhone','16 Pro',0.46,'{"x":0.05,"y":0.04,"w":0.36,"h":0.26}',5),
  ('ip16','iPhone','16 / 16 Plus',0.48,'{"x":0.05,"y":0.04,"w":0.3,"h":0.2}',6),
  ('ip15pm','iPhone','15 Pro Max',0.49,'{"x":0.05,"y":0.04,"w":0.36,"h":0.26}',7),
  ('ip15','iPhone','15 / 15 Pro',0.49,'{"x":0.05,"y":0.04,"w":0.3,"h":0.2}',8),
  ('ip14','iPhone','14 / 13',0.49,'{"x":0.05,"y":0.04,"w":0.3,"h":0.2}',9),
  ('ip12','iPhone','12 / 11',0.49,'{"x":0.05,"y":0.04,"w":0.3,"h":0.2}',10),
  ('ipse','iPhone','SE (2022)',0.49,'{"x":0.05,"y":0.04,"w":0.2,"h":0.12}',11),
  ('s24u','Samsung','Galaxy S24 Ultra',0.46,'{"x":0.06,"y":0.05,"w":0.16,"h":0.26}',12),
  ('s24p','Samsung','Galaxy S24+',0.46,'{"x":0.06,"y":0.05,"w":0.16,"h":0.26}',13),
  ('s24','Samsung','Galaxy S24',0.47,'{"x":0.06,"y":0.05,"w":0.16,"h":0.26}',14),
  ('s23u','Samsung','Galaxy S23 Ultra',0.45,'{"x":0.06,"y":0.05,"w":0.16,"h":0.26}',15),
  ('s23','Samsung','Galaxy S23',0.48,'{"x":0.06,"y":0.05,"w":0.16,"h":0.26}',16),
  ('a55','Samsung','Galaxy A55 / A54',0.47,'{"x":0.06,"y":0.05,"w":0.16,"h":0.26}',17),
  ('zflip5','Samsung','Galaxy Z Flip 5',0.84,'{"x":0.06,"y":0.05,"w":0.16,"h":0.26}',18),
  ('zfold5','Samsung','Galaxy Z Fold 5',0.44,'{"x":0.06,"y":0.05,"w":0.16,"h":0.26}',19),
  ('pixel9p','Google','Pixel 9 Pro',0.47,'{"x":0.08,"y":0.07,"w":0.84,"h":0.12}',20),
  ('pixel8pro','Google','Pixel 8 Pro',0.48,'{"x":0.08,"y":0.07,"w":0.84,"h":0.12}',21),
  ('pixel8','Google','Pixel 8 / 8a',0.47,'{"x":0.08,"y":0.07,"w":0.84,"h":0.12}',22),
  ('pixel7','Google','Pixel 7',0.48,'{"x":0.08,"y":0.07,"w":0.84,"h":0.12}',23),
  ('xiaomi14','Xiaomi','Xiaomi 14',0.46,'{"x":0.06,"y":0.05,"w":0.28,"h":0.24}',24),
  ('redmi13','Xiaomi','Redmi Note 13',0.46,'{"x":0.06,"y":0.05,"w":0.28,"h":0.24}',25),
  ('oneplus12','OnePlus','OnePlus 12',0.46,'{"x":0.06,"y":0.05,"w":0.28,"h":0.24}',26),
  ('oppo','OPPO','Reno 11',0.46,'{"x":0.06,"y":0.05,"w":0.28,"h":0.24}',27)
on conflict (id) do nothing;

insert into backgrounds (id, name, colors, sort) values
  ('bubblegum','Bubblegum','["#FF7EC0","#FF3E9A"]',0),
  ('cotton','Cotton Candy','["#FFD6EC","#C8B6FF"]',1),
  ('sunset','K-Sunset','["#FFC3A0","#FF5470"]',2),
  ('midnight','Midnight Stan','["#2B1B3D","#141018"]',3),
  ('mint','Fresh Mint','["#B8F2E6","#8ED1C6"]',4),
  ('cream','Cream','["#FFF5FA","#FFE9F4"]',5),
  ('lilac','Lilac Dream','["#E4C1F9","#B892FF"]',6),
  ('solidpink','Hot Pink','["#FF3E9A","#FF3E9A"]',7)
on conflict (id) do nothing;

-- Added later alongside the frame-shape gallery templates below — these
-- back the Berry Duo / Peachy Keen / etc. templates and are also selectable
-- directly from the blank-case color picker, so they belong in this catalog
-- table too (mirrors storefront/src/mock.ts's `backgrounds` array, which had
-- drifted ahead of this seed, causing the live fetch to momentarily replace
-- a bigger local fallback list with a smaller live one on every page load).
insert into backgrounds (id, name, colors, pattern, sort) values
  ('gingham-berry','Gingham Picnic','["#FCE9C6","#E4574A"]','gingham',8),
  ('peachy','Peachy Keen','["#FFE3C6","#FFB37B"]',null,9),
  ('melon','Melon Splash','["#C8F5D6","#5FC98A"]',null,10),
  ('citrus','Sunny Citrus','["#FFDDB0","#FF9A3D"]',null,11),
  ('donutcream','Donut Cream','["#FFE9F4","#FFC2E0"]',null,12),
  ('bearmint','Bear Mint','["#B8F2E6","#6FC9B8"]',null,13),
  ('bunnypink','Bunny Pink','["#FFE3F0","#FFB8DA"]',null,14),
  ('puppytan','Puppy Tan','["#FFECD2","#FFD199"]',null,15),
  ('kittylilac','Kitty Lilac','["#EDE1FB","#C9A6F5"]',null,16)
on conflict (id) do nothing;

insert into sticker_packs (id, name, cover, sort) values
  ('hearts','Love','💗',0),
  ('kpop','K-Pop','🎤',1),
  ('cute','Cutie','🐰',2),
  ('sparkle','Sparkle','✨',3)
on conflict (id) do nothing;

-- Casey Case Gallery — mirrors the 4 templates bundled in mobile/src/data/catalog.ts
-- so a freshly connected backend starts with the same gallery the app already
-- ships in local/mock mode. Admins can add more from the dashboard or by
-- publishing designs from the mobile editor.
insert into templates (id, name, tag, accent, background, layers, featured, sort) values
  ('t-stan', 'Stan 4 Life', 'Trending', '#FF3E9A',
   '{"id":"midnight","name":"Midnight Stan","colors":["#2B1B3D","#141018"]}',
   '[{"kind":"text","text":"STAN\n4 LIFE","color":"#FF3E9A","fontSize":46,"fontWeight":"900","align":"center","tx":0,"ty":-40,"scale":1,"rotation":0,"z":2},
     {"kind":"sticker","emoji":"🖤","size":60,"tx":-70,"ty":90,"scale":1,"rotation":-0.2,"z":1},
     {"kind":"sticker","emoji":"⭐","size":44,"tx":80,"ty":-140,"scale":1,"rotation":0.3,"z":1}]',
   true, 0),
  ('t-love', 'Love Print Stan', 'Casey pick', '#FF7EC0',
   '{"id":"bubblegum","name":"Bubblegum","colors":["#FF7EC0","#FF3E9A"]}',
   '[{"kind":"text","text":"love.\nprint.\nstan.","color":"#FFFFFF","fontSize":40,"fontWeight":"800","align":"left","tx":-30,"ty":0,"scale":1,"rotation":0,"z":2},
     {"kind":"sticker","emoji":"💗","size":52,"tx":80,"ty":-150,"scale":1,"rotation":0.1,"z":1},
     {"kind":"sticker","emoji":"🐰","size":64,"tx":70,"ty":150,"scale":1,"rotation":0,"z":1}]',
   true, 1),
  ('t-bunny', 'Bunny Blush', 'New', '#C8B6FF',
   '{"id":"cotton","name":"Cotton Candy","colors":["#FFD6EC","#C8B6FF"]}',
   '[{"kind":"sticker","emoji":"🐰","size":120,"tx":0,"ty":-30,"scale":1,"rotation":0,"z":2},
     {"kind":"text","text":"be a cutie","color":"#D6006E","fontSize":30,"fontWeight":"800","align":"center","tx":0,"ty":110,"scale":1,"rotation":0,"z":2},
     {"kind":"sticker","emoji":"🎀","size":40,"tx":-80,"ty":-150,"scale":1,"rotation":-0.3,"z":1}]',
   true, 2),
  ('t-idol', 'Idol Frame', 'Photo', '#FF5470',
   '{"id":"sunset","name":"K-Sunset","colors":["#FFC3A0","#FF5470"]}',
   '[{"kind":"text","text":"♡ my bias ♡","color":"#FFFFFF","fontSize":26,"fontWeight":"800","align":"center","tx":0,"ty":150,"scale":1,"rotation":0,"z":3},
     {"kind":"sticker","emoji":"📸","size":50,"tx":0,"ty":-160,"scale":1,"rotation":0,"z":2}]',
   true, 3)
on conflict (id) do nothing;

-- Added later (2026-09-25 face-frame shapes, plus Berry Duo / real-photo /
-- full-case-wrap templates) — storefront/src/mock.ts's fallback catalog grew
-- to 15 templates while this seed stayed at the original 4, so a connected
-- backend momentarily replaced the bigger local fallback with this smaller
-- live set on every page load (visible as the gallery flashing down from 15
-- cards to 4). Backfilling these keeps the live catalog in sync.
insert into templates (id, name, tag, accent, background, layers, featured, sort) values
  ('t-berry-duo', 'Berry Duo', 'Photo', '#E4574A',
   '{"id":"gingham-berry","name":"Gingham Picnic","colors":["#FCE9C6","#E4574A"],"pattern":"gingham"}',
   '[{"kind":"frame","frameId":"strawberry","photoUri":null,"photoTx":0,"photoTy":0,"photoScale":1,"tx":-72,"ty":-35,"scale":0.62,"rotation":-0.06,"z":2},
     {"kind":"frame","frameId":"cherry","photoUri":null,"photoTx":0,"photoTy":0,"photoScale":1,"tx":72,"ty":-35,"scale":0.62,"rotation":0.06,"z":2},
     {"kind":"text","text":"besties","color":"#B23A2E","fontSize":30,"fontWeight":"800","align":"center","tx":0,"ty":155,"scale":1,"rotation":0,"z":3},
     {"kind":"sticker","emoji":"✨","size":34,"tx":-118,"ty":-155,"scale":1,"rotation":-0.2,"z":1},
     {"kind":"sticker","emoji":"✨","size":34,"tx":118,"ty":-155,"scale":1,"rotation":0.2,"z":1}]',
   false, 4),
  ('t-peach', 'Peachy Keen', 'Frame', '#E8720C',
   '{"id":"peachy","name":"Peachy Keen","colors":["#FFE3C6","#FFB37B"]}',
   '[{"kind":"frame","frameId":"peach","photoUri":null,"photoTx":0,"photoTy":0,"photoScale":1,"tx":0,"ty":-8,"scale":1.05,"rotation":0,"z":2},
     {"kind":"sticker","emoji":"✨","size":36,"tx":-100,"ty":-150,"scale":1,"rotation":-0.2,"z":1},
     {"kind":"sticker","emoji":"🎀","size":40,"tx":96,"ty":150,"scale":1,"rotation":0.2,"z":1}]',
   false, 5),
  ('t-watermelon', 'Melon Splash', 'Frame', '#2E9E5B',
   '{"id":"melon","name":"Melon Splash","colors":["#C8F5D6","#5FC98A"]}',
   '[{"kind":"frame","frameId":"watermelon","photoUri":null,"photoTx":0,"photoTy":0,"photoScale":1,"tx":0,"ty":-8,"scale":1.05,"rotation":0,"z":2},
     {"kind":"sticker","emoji":"✨","size":36,"tx":-100,"ty":-150,"scale":1,"rotation":-0.2,"z":1},
     {"kind":"sticker","emoji":"🎀","size":40,"tx":96,"ty":150,"scale":1,"rotation":0.2,"z":1}]',
   false, 6),
  ('t-orange', 'Sunny Citrus', 'Frame', '#E8720C',
   '{"id":"citrus","name":"Sunny Citrus","colors":["#FFDDB0","#FF9A3D"]}',
   '[{"kind":"frame","frameId":"orange","photoUri":null,"photoTx":0,"photoTy":0,"photoScale":1,"tx":0,"ty":-8,"scale":1.05,"rotation":0,"z":2},
     {"kind":"sticker","emoji":"✨","size":36,"tx":-100,"ty":-150,"scale":1,"rotation":-0.2,"z":1},
     {"kind":"sticker","emoji":"🎀","size":40,"tx":96,"ty":150,"scale":1,"rotation":0.2,"z":1}]',
   false, 7),
  ('t-donut', 'Donut Vibes', 'Frame', '#E85AA0',
   '{"id":"donutcream","name":"Donut Cream","colors":["#FFE9F4","#FFC2E0"]}',
   '[{"kind":"frame","frameId":"donut","photoUri":null,"photoTx":0,"photoTy":0,"photoScale":1,"tx":0,"ty":-8,"scale":1.05,"rotation":0,"z":2},
     {"kind":"sticker","emoji":"✨","size":36,"tx":-100,"ty":-150,"scale":1,"rotation":-0.2,"z":1},
     {"kind":"sticker","emoji":"🎀","size":40,"tx":96,"ty":150,"scale":1,"rotation":0.2,"z":1}]',
   false, 8),
  ('t-bear', 'Bear Hug', 'Frame', '#3D9C89',
   '{"id":"bearmint","name":"Bear Mint","colors":["#B8F2E6","#6FC9B8"]}',
   '[{"kind":"frame","frameId":"bear","photoUri":null,"photoTx":0,"photoTy":0,"photoScale":1,"tx":0,"ty":-8,"scale":1.05,"rotation":0,"z":2},
     {"kind":"sticker","emoji":"⭐","size":36,"tx":-100,"ty":-150,"scale":1,"rotation":-0.2,"z":1},
     {"kind":"sticker","emoji":"🎀","size":40,"tx":96,"ty":150,"scale":1,"rotation":0.2,"z":1}]',
   false, 9),
  ('t-bunny-frame', 'Bunny Love', 'Frame', '#FF6FAE',
   '{"id":"bunnypink","name":"Bunny Pink","colors":["#FFE3F0","#FFB8DA"]}',
   '[{"kind":"frame","frameId":"bunny","photoUri":null,"photoTx":0,"photoTy":0,"photoScale":1,"tx":0,"ty":-8,"scale":1.05,"rotation":0,"z":2},
     {"kind":"sticker","emoji":"✨","size":36,"tx":-100,"ty":-150,"scale":1,"rotation":-0.2,"z":1},
     {"kind":"sticker","emoji":"🎀","size":40,"tx":96,"ty":150,"scale":1,"rotation":0.2,"z":1}]',
   false, 10),
  ('t-dog', 'Puppy Love', 'Frame', '#E8A23D',
   '{"id":"puppytan","name":"Puppy Tan","colors":["#FFECD2","#FFD199"]}',
   '[{"kind":"frame","frameId":"dog","photoUri":null,"photoTx":0,"photoTy":0,"photoScale":1,"tx":0,"ty":-8,"scale":1.05,"rotation":0,"z":2},
     {"kind":"sticker","emoji":"✨","size":36,"tx":-100,"ty":-150,"scale":1,"rotation":-0.2,"z":1},
     {"kind":"sticker","emoji":"🐾","size":34,"tx":96,"ty":150,"scale":1,"rotation":0.2,"z":1}]',
   false, 11),
  ('t-cat', 'Kitty Cutie', 'Frame', '#8B4FD1',
   '{"id":"kittylilac","name":"Kitty Lilac","colors":["#EDE1FB","#C9A6F5"]}',
   '[{"kind":"frame","frameId":"cat","photoUri":null,"photoTx":0,"photoTy":0,"photoScale":1,"tx":0,"ty":-8,"scale":1.05,"rotation":0,"z":2},
     {"kind":"sticker","emoji":"✨","size":36,"tx":-100,"ty":-150,"scale":1,"rotation":-0.2,"z":1},
     {"kind":"sticker","emoji":"🎀","size":40,"tx":96,"ty":150,"scale":1,"rotation":0.2,"z":1}]',
   false, 12),
  ('t-strawberry-real', 'Strawberry (Real)', 'Real Photo', '#B23A2E',
   '{"id":"gingham-berry","name":"Gingham Picnic","colors":["#FCE9C6","#E4574A"],"pattern":"gingham"}',
   '[{"kind":"frame","frameId":"strawberry-photo","photoUri":null,"photoTx":0,"photoTy":0,"photoScale":1,"tx":0,"ty":-6,"scale":1.05,"rotation":0,"z":2},
     {"kind":"sticker","emoji":"🎀","size":38,"tx":-100,"ty":-150,"scale":1,"rotation":-0.2,"z":1},
     {"kind":"sticker","emoji":"🎀","size":38,"tx":100,"ty":150,"scale":1,"rotation":0.2,"z":1}]',
   false, 13),
  ('t-full-photo', 'Your Photo, Full Case', 'Real Print', '#2c2c31',
   '{"id":"cream","name":"Cream","colors":["#FFF5FA","#FFE9F4"]}',
   '[{"kind":"image","uri":null,"width":320,"height":667,"radius":0,"tx":0,"ty":0,"scale":1,"rotation":0,"z":1}]',
   false, 14)
on conflict (id) do nothing;

-- To grant dashboard access, sign up in the admin app, then run:
--   insert into admins (user_id, email) select id, email from auth.users where email = 'you@email.com';
