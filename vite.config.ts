import { defineConfig } from "vite";
import { resolve } from "path";

declare var __dirname: string;
export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                background: resolve(__dirname, "background.html"),
            },
        },
    },
});
