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
	openapi-typescript https://ttrpg_api-1-v7423234.deta.app/openapi.json -o src/ttrpgapi/schema.d.ts