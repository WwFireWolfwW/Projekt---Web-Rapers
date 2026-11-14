-- Dodatečné limity pro nové a upravené řádky; původní data zůstávají zachována.
alter table public.ratings add constraint ratings_comment_length check (comment is null or char_length(comment)<=1000) not valid;
alter table public.quiz_scores add constraint quiz_scores_maximum check (score<=10) not valid;
