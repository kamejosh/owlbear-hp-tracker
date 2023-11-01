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
	openapi-typescript https://ttrpg-api.bitperfect-software.com/openapi.json -o src/ttrpgapi/schema.d.ts