install:
	npm ci

lint:
	npx eslint .

build:
	npm run build

develop:
	npx webpack serve --open
