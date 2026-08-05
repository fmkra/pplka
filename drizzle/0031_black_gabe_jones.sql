CREATE TABLE "nauka-ppla_buy_coffee_banner_impression" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"dismissalCount" integer NOT NULL,
	"pathname" varchar(255) NOT NULL,
	"shownAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
