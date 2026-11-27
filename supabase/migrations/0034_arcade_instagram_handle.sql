-- 0034: the official Instagram account is @itbinsight, not @itb.insight.
-- 0031 seeded the Insight Arcade side quests (and 0021 the older ones) with the wrong handle in
-- titles, descriptions and shortcut links. Idempotent: replace() is a no-op once fixed.

update public.sidequests
set title = replace(title, '@itb.insight', '@itbinsight'),
    description = replace(description, '@itb.insight', '@itbinsight'),
    shortcut_url = replace(shortcut_url, 'instagram.com/itb.insight', 'instagram.com/itbinsight')
where title like '%@itb.insight%'
   or description like '%@itb.insight%'
   or shortcut_url like '%instagram.com/itb.insight%';
