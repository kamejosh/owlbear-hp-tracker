// @ts-nocheck
import remarkGfm from "remark-gfm";
import { generateSlug } from "../../helper/helpers.ts";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

export const Markdown = ({ text }: { text: string }) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
                h1: ({ node, ...props }) => (
                    <h1
                        id={generateSlug(typeof props.children === "string" ? props.children : props.children[0])}
                        {...props}
                    ></h1>
                ),
                h2: ({ node, ...props }) => (
                    <h2
                        id={generateSlug(typeof props.children === "string" ? props.children : props.children[0])}
                        {...props}
                    ></h2>
                ),
                h3: ({ node, ...props }) => (
                    <h3
                        id={generateSlug(typeof props.children === "string" ? props.children : props.children[0])}
                        {...props}
                    ></h3>
                ),
                h4: ({ node, ...props }) => {
                    return (
                        <h4
                            id={generateSlug(typeof props.children === "string" ? props.children : props.children[0])}
                            {...props}
                        ></h4>
                    );
                },
                h5: ({ node, ...props }) => (
                    <h5
                        id={generateSlug(typeof props.children === "string" ? props.children : props.children[0])}
                        {...props}
                    ></h5>
                ),
                a: ({ node, ...props }) => {
                    if (props.href?.startsWith("#")) {
                        return (
                            <a href={props.href}>
                                {typeof props.children === "string" ? props.children : props.children[0]}
                            </a>
                        );
                    } else {
                        return (
                            <a href={props.href} target={"_blank"}>
                                {typeof props.children === "string" ? props.children : props.children[0]}
                            </a>
                        );
                    }
                },
            }}
            children={text}
        />
    );
};
