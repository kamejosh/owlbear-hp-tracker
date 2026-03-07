import { PropsWithChildren, useState } from "react";
import styles from "./button.module.css";
import { Delete } from "@mui/icons-material";

type DeleteButtonProps = {
    message: string;
    onClick: () => Promise<void>;
};

export const DeleteButton = (props: PropsWithChildren & DeleteButtonProps) => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                onClick={() => {
                    setOpen(!open);
                }}
                className={styles.deleteButton}
            >
                <Delete />
            </button>
            {/*<ConfirmationDialog*/}
            {/*    message={props.message}*/}
            {/*    buttons={[*/}
            {/*        {*/}
            {/*            label: "Yes",*/}
            {/*            onClick: async () => {*/}
            {/*                await props.onClick();*/}
            {/*                setOpen(false);*/}
            {/*            },*/}
            {/*        },*/}
            {/*        {*/}
            {/*            label: "Cancel",*/}
            {/*            onClick: () => {*/}
            {/*                setOpen(false);*/}
            {/*            },*/}
            {/*        },*/}
            {/*    ]}*/}
            {/*    default={() => {}}*/}
            {/*    open={open}*/}
            {/*/>*/}
        </>
    );
};
