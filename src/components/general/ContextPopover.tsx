import { PropsWithChildren, useEffect, useRef, useState } from "react";
import {
    autoUpdate,
    flip,
    FloatingFocusManager,
    FloatingOverlay,
    FloatingPortal,
    offset,
    shift,
    useDismiss,
    useFloating,
    useInteractions,
} from "@floating-ui/react";
import style from "./context-popover.module.scss";

export const ContextPopover = (props: PropsWithChildren & { context: MouseEvent | null }) => {
    const [isOpen, setIsOpen] = useState(false);

    const allowMouseUpCloseRef = useRef(false);

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        middleware: [
            offset({ mainAxis: 5, alignmentAxis: 4 }),
            flip({
                fallbackPlacements: ["left-start"],
            }),
            shift({ padding: 10 }),
        ],
        placement: "right-start",
        strategy: "fixed",
        whileElementsMounted: autoUpdate,
    });

    const dismiss = useDismiss(context);

    const { getFloatingProps } = useInteractions([dismiss]);

    useEffect(() => {
        let timeout: number;

        function onContextMenu(e: MouseEvent) {
            e.preventDefault();

            refs.setPositionReference({
                getBoundingClientRect() {
                    return {
                        width: 0,
                        height: 0,
                        x: e.clientX,
                        y: e.clientY,
                        top: e.clientY,
                        right: e.clientX,
                        bottom: e.clientY,
                        left: e.clientX,
                    };
                },
            });

            setIsOpen(true);
            clearTimeout(timeout);

            allowMouseUpCloseRef.current = false;
            timeout = window.setTimeout(() => {
                allowMouseUpCloseRef.current = true;
            }, 300);
        }

        function onMouseUp() {
            if (allowMouseUpCloseRef.current) {
                setIsOpen(false);
            }
        }

        if (props.context) {
            onContextMenu(props.context);
        } else {
            onMouseUp();
        }
    }, [refs, props.context]);

    return (
        <FloatingPortal>
            {isOpen && (
                <FloatingOverlay lockScroll style={{ zIndex: 5 }}>
                    <FloatingFocusManager context={context} initialFocus={refs.floating}>
                        <div
                            className={style.contextPopover}
                            ref={refs.setFloating}
                            style={floatingStyles}
                            {...getFloatingProps()}
                        >
                            {props.children}
                        </div>
                    </FloatingFocusManager>
                </FloatingOverlay>
            )}
        </FloatingPortal>
    );
};
