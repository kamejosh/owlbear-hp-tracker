import styles from "./button.module.css";
import { FieldValues, UseFormReturn } from "react-hook-form";

export type SubmitButtonProps<T extends FieldValues> = {
    form: UseFormReturn<T>;
    pending: boolean;
};

export const SubmitButton = <T extends FieldValues>({ form, pending }: SubmitButtonProps<T>) => {
    return (
        <button
            className={`${styles.submitButton} ${pending ? styles.loading : ""}`}
            type={"submit"}
            disabled={!form.formState.isValid || Object.values(form.formState.errors).length > 0}
        >
            Submit
        </button>
    );
};
