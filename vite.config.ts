import { defineConfig } from "vite";
import { resolve } from "path";
import mkcert from "vite-plugin-mkcert";
import copy from "rollup-plugin-copy";

declare var __dirname: string;
export default defineConfig({
    server: { host: "0.0.0.0", cors: true },
    assetsInclude: ["**/*.md"],
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                popover: resolve(__dirname, "popover.html"),
                background: resolve(__dirname, "background.html"),
                modal: resolve(__dirname, "modal.html"),
                statblock: resolve(__dirname, "statblock.html"),
                rolllog: resolve(__dirname, "rolllog.html"),
            },
            /**
             * Ignore "use client" waning since we are not using SSR
             * @see {@link https://github.com/TanStack/query/pull/5161#issuecomment-1477389761 Preserve 'use client' directives TanStack/query#5161}
             */
            onwarn(warning, warn) {
                if (warning.code === "MODULE_LEVEL_DIRECTIVE" && warning.message.includes(`"use client"`)) {
                    return;
                }
                warn(warning);
            },
        },
    },
    plugins: [
        mkcert(),
        copy({
            targets: [{ src: resolve(__dirname, "_headers"), dest: "dist/" }],
            hook: "writeBundle",
        }),
    ],
    css: {
        preprocessorOptions: {
            scss: {
                api: "modern-compiler", // or "modern", "legacy"
            },
        },
    },
});
