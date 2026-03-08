import { PropsWithChildren, useState } from "react";
import styles from "./button.module.css";
import { Delete } from "@mui/icons-material";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    CircularProgress,
} from "@mui/material";

type DeleteButtonProps = {
    message: string;
    onClick: () => Promise<void>;
};

export const DeleteButton = (props: PropsWithChildren & DeleteButtonProps) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        if (!loading) {
            setOpen(false);
        }
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await props.onClick();
            setOpen(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button onClick={handleOpen} className={styles.deleteButton}>
                <Delete />
            </button>
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="delete-dialog-title"
                slotProps={{ paper: { sx: { backgroundColor: "#2b2a33", color: "white" } } }}
            >
                <DialogTitle id="delete-dialog-title">Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: "white" }}>{props.message}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={loading} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={loading}
                        color="error"
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Delete />}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
