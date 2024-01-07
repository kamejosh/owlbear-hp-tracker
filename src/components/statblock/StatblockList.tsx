import { Statblock } from "../hptracker/charactersheet/Statblock.tsx";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { Item } from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";
import { characterMetadata } from "../../helper/variables.ts";
import { HpTrackerMetadata } from "../../helper/types.ts";
import SwiperClass from "swiper/types/swiper-class";

type StatblockListProps = {
    minimized: boolean;
    tokens: Array<Item>;
    pinned: boolean;
    setPinned: (pinned: boolean) => void;
    slug: string | null;
};
export const StatblockList = (props: StatblockListProps) => {
    const [slug, setSlug] = useState<string | null>(null);
    const [swiper, setSwiper] = useState<SwiperClass>();

    useEffect(() => {
        if (!props.pinned && props.slug) {
            setSlug(props.slug);
            const index = props.tokens.findIndex((item) => {
                if (characterMetadata in item.metadata) {
                    const metadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                    return metadata.sheet === props.slug;
                }
                return false;
            });
            if (index >= 0 && swiper) {
                swiper.slideTo(index, 100, false);
            }
        }
    }, [props.slug]);

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
                    const data = token.metadata[characterMetadata] as HpTrackerMetadata;
                    return (
                        <SwiperSlide
                            className={`statblock-name ${slug === data.sheet ? "active" : ""}`}
                            onClick={() => setSlug(data.sheet)}
                            key={token.id}
                            title={data.name}
                        >
                            <span className={"name"}>{data.name}</span>
                            {slug === data.sheet ? (
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
                <div className={"statblock-sheet"}>{slug ? <Statblock slug={slug} /> : null}</div>
            )}
        </>
    );
};
