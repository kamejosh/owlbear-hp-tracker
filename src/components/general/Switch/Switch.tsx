import { CSSProperties } from "react";

type SwitchProps = {
    labels: { left: string; right: string };
    onChange: (checked: boolean) => void;
    checked: boolean;
    class?: string;
    backgroundImages?: { left: string; right: string };
    colors?: { left: string; right: string };
};

export const Switch = (props: SwitchProps) => {
    const style = {
        "--default-bg": `url(${props.backgroundImages?.left})`,
        "--checked-bg": `url(${props.backgroundImages?.right})`,
        "--default-color": props.colors?.left ?? "#bc0f0f",
        "--checked-color": props.colors?.right ?? "#b4926d",
    } as CSSProperties;
    return (
        <div className={"switch-wrapper"}>
            {props.labels.left}
            <label className={`switch ${props.class}`}>
                <input
                    defaultChecked={props.checked}
                    type={"checkbox"}
                    onClick={(e) => {
                        e.currentTarget.blur();
                    }}
                    onChange={(e) => {
                        props.onChange(e.currentTarget.checked);
                    }}
                />
                <span
                    className={"slider"}
                    style={style}
                    data-bg-checked={props.backgroundImages?.right}
                    data-bg-default={props.backgroundImages?.left}
                />
            </label>
            {props.labels.right}
        </div>
    );
};
