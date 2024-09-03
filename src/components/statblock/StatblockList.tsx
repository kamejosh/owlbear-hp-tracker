import { Statblock } from "../hptracker/charactersheet/Statblock.tsx";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Mousewheel } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/mousewheel";
import { useCallback, useEffect, useState } from "react";
import { itemMetadataKey } from "../../helper/variables.ts";
import { HpTrackerMetadata } from "../../helper/types.ts";
import SwiperClass from "swiper/types/swiper-class";
import { getBgColor, sortItems, updateSceneMetadata } from "../../helper/helpers.ts";
import { useTokenListContext } from "../../context/TokenContext.tsx";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import { usePlayerContext } from "../../context/PlayerContext.ts";

type StatblockListProps = {
    minimized: boolean;
    pinned: boolean;
    setPinned: (pinned: boolean) => void;
    selection?: string;
};
export const StatblockList = (props: StatblockListProps) => {
    const tokens = useTokenListContext((state) => state.tokens);
    const playerContext = usePlayerContext();
    const [scene, collapsedStatblocks] = useMetadataContext((state) => [state.scene, state.scene?.collapsedStatblocks]);
    const { isReady } = SceneReadyContext();
    const [id, setId] = useState<string | undefined>();
    const [swiper, setSwiper] = useState<SwiperClass>();
    const [scrollTargets, setScrollTargets] = useState<Array<{ name: string; target: string }>>([]);
    const items = useCallback(() => {
        if (tokens) {
            const itemList = [...tokens].map((t) => t[1].item).sort(sortItems);
            if (playerContext.role === "GM") {
                return itemList;
            } else if (playerContext.role === "PLAYER") {
                return itemList.filter((item) => item.createdUserId === playerContext.id);
            }
        }
        return [];
    }, [tokens, playerContext])();

    useEffect(() => {
        if ((!id || !items.map((i) => i.id).includes(id)) && items.length > 0) {
            setId(items[0].id);
            if (swiper) {
                swiper.slideTo(0, 100, false);
            }
        }
    }, [items, id]);

    useEffect(() => {
        if (!props.pinned && props.selection) {
            const index = items.findIndex((item) => {
                if (props.selection) {
                    const collapsed = collapsedStatblocks?.includes(item.id);
                    return item.id === props.selection && !collapsed;
                }
                return false;
            });
            if (index >= 0 && swiper) {
                setId(items[index].id);
                swiper.slideTo(index, 100, false);
            }
        }
    }, [props.selection]);

    return isReady && scene ? (
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
                    const collapsed = collapsedStatblocks?.includes(item.id);

                    return (
                        <SwiperSlide
                            className={`statblock-name ${item.id === id ? "active" : ""} ${
                                collapsed && item.id !== id ? "collapsed" : ""
                            }`}
                            onClick={() => {
                                setId(item.id);
                            }}
                            onContextMenu={async (e) => {
                                e.preventDefault();

                                if (collapsedStatblocks) {
                                    const newCollapse = [...collapsedStatblocks];
                                    if (newCollapse.includes(item.id)) {
                                        newCollapse.splice(
                                            newCollapse.findIndex((c) => c === item.id),
                                            1
                                        );
                                    } else {
                                        newCollapse.push(item.id);
                                    }
                                    await updateSceneMetadata(scene, { collapsedStatblocks: newCollapse });
                                } else {
                                    await updateSceneMetadata(scene, {
                                        collapsedStatblocks: [item.id],
                                    });
                                }
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
            {props.minimized ? null : (
                <div className={"statblock-sheet"}>
                    <ul className={"jump-links fixed"}>
                        {scrollTargets.map((t) => {
                            return (
                                <li key={t.name} className={"button"}>
                                    <a href={`#${t.target}`}>{t.name}</a>
                                </li>
                            );
                        })}
                    </ul>
                    {id ? <Statblock id={id} setScrollTargets={setScrollTargets} /> : null}
                </div>
            )}
        </>
    ) : (
        <></>
    );
};
