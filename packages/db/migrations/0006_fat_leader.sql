CREATE TABLE "param_aliases" (
	"id" serial PRIMARY KEY NOT NULL,
	"alias" text NOT NULL,
	"canonical" text NOT NULL,
	CONSTRAINT "param_aliases_alias_unique" UNIQUE("alias")
);
