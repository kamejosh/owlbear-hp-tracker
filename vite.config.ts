import { defineConfig } from "vite";
import { resolve } from "path";

declare var __dirname: string;
export default defineConfig({
    assetsInclude: ["**/*.md"],
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                popover: resolve(__dirname, "popover.html"),
                background: resolve(__dirname, "background.html"),
            },
        },
    },
});
