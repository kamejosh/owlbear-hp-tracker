import { Statblock } from "../hptracker/charactersheet/Statblock.tsx";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { Item } from "@owlbear-rodeo/sdk";
import { useState } from "react";
import { characterMetadata } from "../../helper/variables.ts";
import { HpTrackerMetadata } from "../../helper/types.ts";

export const StatblockList = (props: { minimized: boolean; tokens: Array<Item> }) => {
    const [slug, setSlug] = useState<string | null>(null);
    return (
        <>
            <Swiper
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
                            {data.name}
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
