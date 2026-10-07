CREATE TABLE "country_notes" (
	"country_code" text NOT NULL,
	"locale" text NOT NULL,
	"known_for" text NOT NULL,
	"good_to_know" text NOT NULL,
	CONSTRAINT "country_notes_country_code_locale_pk" PRIMARY KEY("country_code","locale")
);
