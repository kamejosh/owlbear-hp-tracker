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
	openapi-typescript https://api.tabletop-almanac.com/openapi.json -o src/api/schema.d.ts