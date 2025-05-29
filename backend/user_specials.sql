create table user_specials (
    userid uuid not null,
	value text not null,
	expiration timestamp without time zone,
	usedon timestamp without time zone,
	usedby uuid,
	data jsonb
);
create index user_specials_userid_idx on user_specials(userid);
create index user_specials_usedby_idx on user_specials(usedby);
create unique index user_specials_userid_unique_idx on user_specials(userid);
