// @ts-nocheck
import remarkGfm from "remark-gfm";
import { generateSlug } from "../../helper/helpers.ts";
import ReactMarkdown from "react-markdown";

export const Markdown = ({ text }: { text: string }) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                h1: ({ node, ...props }) => <h1 id={generateSlug(props.children[0] as string)} {...props}></h1>,
                h2: ({ node, ...props }) => <h2 id={generateSlug(props.children[0] as string)} {...props}></h2>,
                h3: ({ node, ...props }) => <h3 id={generateSlug(props.children[0] as string)} {...props}></h3>,
                h4: ({ node, ...props }) => <h4 id={generateSlug(props.children[0] as string)} {...props}></h4>,
                h5: ({ node, ...props }) => <h5 id={generateSlug(props.children[0] as string)} {...props}></h5>,
                a: ({ node, ...props }) => {
                    if (props.href?.startsWith("#")) {
                        return <a href={props.href}>{props.children[0]}</a>;
                    } else {
                        return (
                            <a href={props.href} target={"_blank"}>
                                {props.children[0]}
                            </a>
                        );
                    }
                },
            }}
            children={text}
        />
    );
};
