default: clean install run

build:
	yarn run build

run:
	yarn vite

install:
	yarn install

clean:
	rm -rf node_modules

api:
	openapi-typescript http://localhost:8666/openapi.json -o src/api/schema.d.ts

live-api:
	openapi-typescript https://api.tabletop-almanac.com/openapi.json -o src/api/schema.d.ts