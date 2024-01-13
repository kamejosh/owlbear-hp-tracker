import { Statblock } from "../hptracker/charactersheet/Statblock.tsx";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { Item } from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";
import { characterMetadata } from "../../helper/variables.ts";
import { HpTrackerMetadata, SceneMetadata } from "../../helper/types.ts";
import SwiperClass from "swiper/types/swiper-class";

type StatblockListProps = {
    minimized: boolean;
    tokens: Array<Item>;
    pinned: boolean;
    setPinned: (pinned: boolean) => void;
    data: HpTrackerMetadata | null;
    currentSceneMetadata: SceneMetadata | null;
};
export const StatblockList = (props: StatblockListProps) => {
    const [data, setData] = useState<HpTrackerMetadata | null>(null);
    const [id, setId] = useState<string>();
    const [swiper, setSwiper] = useState<SwiperClass>();

    useEffect(() => {
        if (!props.pinned && props.data) {
            setData(props.data);
            const index = props.tokens.findIndex((item) => {
                if (characterMetadata in item.metadata && props.data) {
                    const metadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                    return metadata.index === props.data.index && metadata.sheet === props.data.sheet;
                }
                return false;
            });
            if (index >= 0 && swiper) {
                setId(props.tokens[index].id);
                swiper.slideTo(index, 100, false);
            }
        }
    }, [props.data]);

    const matches = (currentData: HpTrackerMetadata | null, itemData: HpTrackerMetadata) => {
        return (
            currentData?.index === itemData.index &&
            currentData?.sheet === itemData.sheet &&
            currentData?.group === itemData.group
        );
    };

    return (
        <>
            <Swiper
                onSwiper={setSwiper}
                className={`statblock-list ${props.minimized ? "minimized" : ""}`}
                direction={`horizontal`}
                slidesPerView={"auto"}
                spaceBetween={0}
                modules={[FreeMode]}
                freeMode={true}
            >
                <SwiperSlide className={"pre"}> </SwiperSlide>
                {props.tokens.map((token) => {
                    const tokenData = token.metadata[characterMetadata] as HpTrackerMetadata;
                    return (
                        <SwiperSlide
                            className={`statblock-name ${matches(data, tokenData) ? "active" : ""}`}
                            onClick={() => {
                                setData(tokenData);
                                setId(token.id);
                            }}
                            key={token.id}
                            title={tokenData.name}
                        >
                            <span className={"name"}>{tokenData.name}</span>
                            {matches(data, tokenData) ? (
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
            {props.minimized ? null : (
                <div className={"statblock-sheet"}>
                    {data && id ? (
                        <Statblock data={data} currentSceneMetadata={props.currentSceneMetadata} itemId={id} />
                    ) : null}
                </div>
            )}
        </>
    );
};
