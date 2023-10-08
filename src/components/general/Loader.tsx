import { TailSpin } from "react-loader-spinner";

type LoaderProps = {
    className?: string;
};
export const Loader = (props: LoaderProps) => {
    return (
        <TailSpin
            height="60"
            width="60"
            color="#fff"
            ariaLabel="tail-spin-loading"
            radius="1"
            visible={true}
            wrapperClass={props.className}
        />
    );
};
