import { useLocalStorage } from "../../../helper/hooks.ts";
import { ID } from "../../../helper/variables.ts";

export const About = ({ about, slug }: { about?: string | null; slug: string }) => {
    const [open, setOpen] = useLocalStorage<boolean>(`${ID}.about.${slug}`, false);

    return about ? (
        <div className={"about"}>
            <h3>About</h3>
            <button className={`expand ${open ? "open" : null}`} onClick={() => setOpen(!open)}></button>
            <div className={`about-content-wrapper ${open ? "open" : "hidden"}`}>
                <div className={"about-content"}>{about}</div>
            </div>
        </div>
    ) : null;
};
