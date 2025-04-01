import { ReactNode, useState } from "react";

type Option = {
    value: string;
    name: string;
    icon?: ReactNode;
};

export type SelectProps = {
    options: Array<Option>;
    current?: Option | undefined;
    setTheme: (themeId: string) => void;
};

export const Select = ({ options, current, setTheme }: SelectProps) => {
    const [value, setValue] = useState<Option | undefined>(current);
    const [select, setSelect] = useState<boolean>(false);

    return (
        <div className={`select ${select ? "open" : "close"}`}>
            <div className={"select-current"} onClick={() => setSelect(true)}>
                <span className={"current"}>
                    {value?.icon || null}
                    <span>{value?.name || ""}</span>
                </span>
                <div className={"expand-wrapper"}>
                    <button className={"expand button"}></button>
                </div>
            </div>
            <div className={"height-wrapper"}>
                <div className={"options-wrapper"}>
                    <div className={"select-options"}>
                        {options
                            .sort((a, b) => {
                                if (a.value === value?.value) {
                                    return -1;
                                } else if (b.value === value?.value) {
                                    return 1;
                                } else {
                                    return 0;
                                }
                            })
                            .map((option) => {
                                return (
                                    <div
                                        key={option.value}
                                        className={`select-option ${value?.value === option.value ? "current" : ""}`}
                                        onClick={() => {
                                            setValue(option);
                                            setTheme(option.value);
                                            setSelect(false);
                                        }}
                                    >
                                        {option.icon || null}
                                        <span className={"name"}>{option.name} </span>
                                    </div>
                                );
                            })}
                    </div>
                    <div
                        className={"expand-wrapper"}
                        onClick={() => {
                            setSelect(false);
                        }}
                    >
                        <button className={"expand button"}></button>
                    </div>
                </div>
            </div>
        </div>
    );
};
