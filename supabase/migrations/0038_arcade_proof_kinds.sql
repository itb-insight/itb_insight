-- Insight Arcade: which proof each side quest takes (restates 0035 after a manual edit drifted).
--
-- The follow quests had been switched to 'link' by hand in the database ("kirim link profil").
-- The proof API keeps the username only for photo proofs, so those quests asked for a username
-- they then dropped. Back to the rule:
--   - follow quests (Instagram, TikTok / X): screenshot + username -> 'photo';
--   - Share Poster, Foto dengan Kyubi + Add Yours and every Add Yours quest: story link -> 'link';
--   - merch and drone soccer: photo -> 'photo'.

-- Follow quests: screenshot + username.
update public.sidequests as q
set description = v.description,
    proof_kind = 'photo'
from (values
  ('arcade-follow-ig',
   'Follow Instagram @itbinsight, lalu unggah screenshot profil @itbinsight yang menunjukkan kamu sudah follow, dan isi username Instagram-mu.'),
  ('arcade-follow-tiktok-x',
   'Follow TikTok @itb_insight atau X @itbinsight, lalu unggah screenshot profilnya yang menunjukkan kamu sudah follow, dan isi username TikTok atau X-mu.')
) as v(slug, description)
where q.slug = v.slug;

-- Story quests: a link to the story.
update public.sidequests
set proof_kind = 'link'
where slug in ('arcade-share-poster-story', 'arcade-foto-kyubi')
   or slug like 'arcade-add-yours-%';

-- Photo quests.
update public.sidequests
set proof_kind = 'photo'
where slug in ('arcade-beli-merch', 'arcade-nonton-drone-soccer');
