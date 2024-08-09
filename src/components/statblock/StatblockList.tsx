import { Statblock } from "../hptracker/charactersheet/Statblock.tsx";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Mousewheel } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/mousewheel";
import { useEffect, useState } from "react";
import { itemMetadataKey } from "../../helper/variables.ts";
import { HpTrackerMetadata } from "../../helper/types.ts";
import SwiperClass from "swiper/types/swiper-class";
import { getBgColor, sortItems } from "../../helper/helpers.ts";
import { useTokenListContext } from "../../context/TokenContext.tsx";

type StatblockListProps = {
    minimized: boolean;
    pinned: boolean;
    setPinned: (pinned: boolean) => void;
    selection?: string;
};
export const StatblockList = (props: StatblockListProps) => {
    const tokens = useTokenListContext((state) => state.tokens);
    const items = tokens ? [...tokens].map((t) => t[1].item).sort(sortItems) : [];
    const [id, setId] = useState<string | undefined>();
    const [swiper, setSwiper] = useState<SwiperClass>();

    useEffect(() => {
        if (!id && items.length > 0) {
            setId(items[0].id);
        }
    }, [items, id]);

    useEffect(() => {
        if (!props.pinned && props.selection) {
            setId(props.selection);
            const index = items.findIndex((item) => {
                if (props.selection) {
                    return item.id === props.selection;
                }
                return false;
            });
            if (index >= 0 && swiper) {
                setId(items[index].id);
                swiper.slideTo(index, 100, false);
            }
        }
    }, [props.selection]);

    return (
        <>
            <Swiper
                onSwiper={setSwiper}
                className={`statblock-list ${props.minimized ? "minimized" : ""}`}
                direction={`horizontal`}
                slidesPerView={"auto"}
                spaceBetween={0}
                modules={[FreeMode, Mousewheel]}
                freeMode={true}
                mousewheel={{ enabled: true, releaseOnEdges: true }}
            >
                <SwiperSlide className={"pre"}> </SwiperSlide>
                {items.map((item) => {
                    const tokenData = item.metadata[itemMetadataKey] as HpTrackerMetadata;

                    return (
                        <SwiperSlide
                            className={`statblock-name ${item.id === id ? "active" : ""}`}
                            onClick={() => {
                                setId(item.id);
                            }}
                            key={item.id}
                            title={tokenData.name}
                            style={{
                                background: `linear-gradient(to right, ${getBgColor(
                                    tokenData
                                )}, #1C1B22 100%, #1C1B22 )`,
                            }}
                        >
                            <span className={"name"}>{tokenData.name}</span>
                            <span className={"hp"}>
                                {tokenData.hp}/{tokenData.maxHp}
                            </span>
                            {item.id === id ? (
                                <button
                                    className={`pin ${props.pinned ? "pinned" : ""}`}
                                    title={"pin statblock"}
                                    onClick={() => props.setPinned(!props.pinned)}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="24"
                                        viewBox="0 -960 960 960"
                                        width="24"
                                    >
                                        <path
                                            d="m640-480 80 80v80H520v240l-40 40-40-40v-240H240v-80l80-80v-280h-40v-80h400v80h-40v280Zm-286 80h252l-46-46v-314H400v314l-46 46Zm126 0Z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                </button>
                            ) : null}
                        </SwiperSlide>
                    );
                })}
                <SwiperSlide className={"post"}> </SwiperSlide>
            </Swiper>
            {props.minimized ? null : <div className={"statblock-sheet"}>{id ? <Statblock id={id} /> : null}</div>}
        </>
    );
};
