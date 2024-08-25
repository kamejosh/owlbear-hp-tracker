export const HPSvg = ({
    percent,
    name,
    className,
    color,
}: {
    percent: number;
    name: string;
    className?: string;
    color?: string;
}) => {
    return (
        <svg className={`hp-icon ${className ?? ""}`} height="24px" viewBox="0 -960 960 960" width="24px">
            <defs>
                <linearGradient id={name} x1="0" x2="0" y1="1" y2="0">
                    <stop stopColor={color ?? "#AA1404"} offset="0%" />
                    <stop stopColor={color ?? "#AA1404"} offset={`${percent}%`} />
                    <stop stopColor="transparent" offset="100%" />
                </linearGradient>
            </defs>
            <path
                d="m480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Z"
                fill={`url(#${name})`}
            />
        </svg>
    );
};
