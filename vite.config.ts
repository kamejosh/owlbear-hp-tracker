import { defineConfig } from "vite";
import { resolve } from "path";
import mkcert from "vite-plugin-mkcert";

declare var __dirname: string;
export default defineConfig({
    server: { https: true },
    plugins: [mkcert()],
    assetsInclude: ["**/*.md"],
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                popover: resolve(__dirname, "popover.html"),
                background: resolve(__dirname, "background.html"),
                modal: resolve(__dirname, "modal.html"),
                statblock: resolve(__dirname, "statblock.html"),
            },
        },
    },
});
