import { Statblock } from "../gmgrimoire/statblocks/Statblock.tsx";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Mousewheel } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/mousewheel";
import { useCallback, useEffect, useState } from "react";
import { itemMetadataKey } from "../../helper/variables.ts";
import { GMGMetadata } from "../../helper/types.ts";
import SwiperClass from "swiper/types/swiper-class";
import { delay, getBgColor, getTokenName, sortItems, updateSceneMetadata } from "../../helper/helpers.ts";
import { useTokenListContext } from "../../context/TokenContext.tsx";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import { useShallow } from "zustand/react/shallow";

type StatblockListProps = {
    minimized: boolean;
    pinned: boolean;
    setPinned: (pinned: boolean) => void;
    selection?: string;
};
export const StatblockList = (props: StatblockListProps) => {
    const tokens = useTokenListContext(useShallow((state) => state.tokens));
    const playerContext = usePlayerContext();
    const [scene, collapsedStatblocks, openStatblocks] = useMetadataContext(
        useShallow((state) => [state.scene, state.scene?.collapsedStatblocks, state.scene?.openStatblocks]),
    );
    const { isReady } = SceneReadyContext();
    const [id, setId] = useState<string | undefined>();
    const [swiper, setSwiper] = useState<SwiperClass>();
    const items = useCallback(() => {
        if (tokens) {
            const itemList = [...tokens]
                .filter((t) => t[1].data.sheet !== "")
                .map((t) => t[1].item)
                .sort(sortItems);
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

    useEffect(() => {
        const updateSwiper = async () => {
            if (swiper) {
                await delay(300);
                swiper.update();
            }
        };
        updateSwiper();
    }, [scene?.openGroups, openStatblocks, collapsedStatblocks]);

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
                    const tokenData = item.metadata[itemMetadataKey] as GMGMetadata;

                    // the tab is collapsed if the tab is explicitly collapsed (collapsedStatblocks)
                    // or if the group of the statblock is collapsed and the statblock is not explicitly open (openStatblocks)
                    const collapsed =
                        collapsedStatblocks?.includes(item.id) ||
                        (!scene.openGroups?.includes(tokenData.group || "Default") &&
                            !openStatblocks?.includes(item.id));

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

                                let newCollapse: Array<string> = [];
                                let newOpen: Array<string> = [];
                                if (collapsed) {
                                    if (collapsedStatblocks?.includes(item.id)) {
                                        newCollapse = [...collapsedStatblocks];
                                        newCollapse.splice(
                                            newCollapse.findIndex((c) => c === item.id),
                                            1,
                                        );
                                    } else {
                                        // token was implicitly collapsed via the group
                                        if (openStatblocks) {
                                            newOpen = [...openStatblocks];
                                        }
                                        newOpen.push(item.id);
                                    }
                                } else {
                                    if (openStatblocks && openStatblocks.includes(item.id)) {
                                        const newOpen = [...openStatblocks];
                                        newOpen.splice(
                                            newOpen.findIndex((c) => c === item.id),
                                            1,
                                        );
                                    }
                                    if (collapsedStatblocks) {
                                        newCollapse = [...collapsedStatblocks];
                                    }
                                    newCollapse.push(item.id);
                                }
                                await updateSceneMetadata(scene, { openStatblocks: newOpen });
                                await updateSceneMetadata(scene, {
                                    collapsedStatblocks: newCollapse,
                                    openStatblocks: newOpen,
                                });
                            }}
                            key={item.id}
                            title={getTokenName(item)}
                            style={{
                                background: `linear-gradient(to right, ${getBgColor(
                                    tokenData,
                                )}, #1C1B22 100%, #1C1B22 )`,
                            }}
                        >
                            <span className={"name"}>{getTokenName(item)}</span>
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
            {props.minimized ? null : id ? <Statblock id={id} /> : null}
        </>
    ) : (
        <></>
    );
};
