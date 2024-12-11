import OBR, { buildCurve, buildText, Curve, Image, isCurve, isText, Item, Text } from "@owlbear-rodeo/sdk";
import { ACItemChanges, GMGMetadata } from "./types.ts";
import { attachmentFilter, deleteAttachments, getACOffset, getAttachedItems, getImageBounds } from "./helpers.ts";
import { itemMetadataKey, infoMetadataKey } from "./variables.ts";
import { addItems, updateItems } from "./obrHelper.ts";

export const createAC = async (ac: number, token: Image) => {
    const bounds = await getImageBounds(token);
    const barHeight = Math.ceil(bounds.height / 4.85);
    const height = Math.abs(bounds.height / 2.3);
    const width = Math.abs(bounds.width / 3);
    const offset = await getACOffset(bounds.height, bounds.width);
    const position = {
        x: bounds.position.x + (bounds.width < 0 ? 0 : bounds.width) - width / 2 + offset.x,
        y: bounds.position.y + bounds.height - (height + barHeight) + offset.y,
    };

    const acShape = buildCurve()
        .points([
            { x: 0, y: 0 },
            { x: width / 2, y: height / 4 },
            { x: width, y: 0 },
            { x: width, y: height / 1.5 },
            { x: width / 2, y: height },
            { x: 0, y: height / 1.5 },
            { x: 0, y: 0 },
        ])
        .tension(0.1)
        .strokeColor("black")
        .strokeWidth(2)
        .fillColor("grey")
        .position(position)
        .layer(token.layer)
        .zIndex(token.zIndex + 1)
        .disableAttachmentBehavior(["VISIBLE", "ROTATION"])
        .visible(token.visible)
        .locked(true)
        .disableHit(true)
        .attachedTo(token.id)
        .build();

    const acText = buildText()
        .textType("PLAIN")
        .width(width)
        .height(height * 0.8)
        .position({ x: position.x, y: position.y + height * 0.15 })
        .attachedTo(acShape.id)
        .layer(token.layer)
        .zIndex(token.zIndex + 2)
        .locked(true)
        .plainText(String(ac))
        .textAlign("CENTER")
        .fontSize(width / 2)
        .strokeColor("black")
        .strokeWidth(2)
        .fontWeight(600)
        .disableHit(true)
        .textAlignVertical("MIDDLE")
        .visible(token.visible)
        .build();

    acShape.metadata[infoMetadataKey] = { isHpText: true, attachmentType: "AC" };
    acText.metadata[infoMetadataKey] = { isHPText: true, attachmentType: "AC" };
    return [acShape, acText];
};

const handleACOffsetUpdate = async (offset: { x: number; y: number }, ac: Item) => {
    const change: ACItemChanges = {};
    if (ac.attachedTo) {
        const tokens = await OBR.scene.items.getItems([ac.attachedTo]);
        if (tokens.length > 0) {
            const token = tokens[0];
            const bounds = await getImageBounds(token as Image);
            const barHeight = Math.ceil(bounds.height / 4.85);
            const height = bounds.height / 2.3;
            const width = Math.abs(bounds.width / 3);
            change.position = {
                x: bounds.position.x + (bounds.width < 0 ? 0 : bounds.width) - width / 2 + offset.x,
                y: bounds.position.y + bounds.height - (height + barHeight) + offset.y,
            };
        }
    }
    return change;
};

export const updateAcOffset = async (offset: { x: number; y: number }) => {
    const acCurves = await OBR.scene.items.getItems(
        (item) => item.type === "CURVE" && infoMetadataKey in item.metadata,
    );
    const changeMap = new Map<string, ACItemChanges>();
    for (const acCurve of acCurves) {
        const change = await handleACOffsetUpdate(offset, acCurve);
        changeMap.set(acCurve.id, change);
    }

    await updateAcChanges(changeMap);
};

export const updateAc = async (token: Item, data: GMGMetadata) => {
    const acAttachment = (await getAttachedItems(token.id, ["CURVE"])).filter((a) => attachmentFilter(a, "AC"));

    const show = data.acOnMap && data.hpTrackerActive;
    const visible = !!data.playerMap?.ac && token.visible;
    if (!show) {
        await deleteAttachments(acAttachment);
    } else {
        const changes = new Map<string, ACItemChanges>();
        await saveOrChangeAC(token, data, acAttachment, changes, visible);
        await updateAcChanges(changes);
    }
};

export const updateAcChanges = async (changes: Map<string, ACItemChanges>) => {
    if (changes.size > 0) {
        await updateItems(
            (item): item is Curve => isCurve(item) && changes.has(item.id),
            (curves) => {
                curves.forEach((curve) => {
                    if (changes.has(curve.id)) {
                        const change = changes.get(curve.id);
                        if (change) {
                            if (change.visible !== undefined) {
                                curve.visible = change.visible;
                            }
                            if (change.position) {
                                curve.position = change.position;
                            }
                        }
                    }
                });
            },
        );
        await updateItems(
            (item): item is Text => isText(item) && changes.has(item.id),
            (items) => {
                items.forEach((item) => {
                    const text = item as Text;
                    if (changes.has(text.id)) {
                        const change = changes.get(text.id);
                        if (change && change.text) {
                            text.text.plainText = change.text;
                        }
                    }
                });
            },
        );
    }
};

export const saveOrChangeAC = async (
    character: Item,
    data: GMGMetadata,
    attachments: Item[],
    changeMap: Map<string, ACItemChanges>,
    visible: boolean,
) => {
    if (attachments.length > 0) {
        for (const a of attachments) {
            if (a.visible !== visible) {
                const change = changeMap.get(a.id) ?? {};
                change.visible = visible;
                changeMap.set(a.id, change);
            }
            const texts = await getAttachedItems(a.id, ["TEXT"]);
            texts.forEach((text) => {
                if (text.type === "TEXT") {
                    const t = text as Text;
                    if (t.text.plainText !== String(data.armorClass)) {
                        const textChange = changeMap.get(t.id) ?? {};
                        textChange.text = String(data.armorClass);
                        changeMap.set(t.id, textChange);
                    }
                }
            });
        }
    } else {
        const ac = await createAC(data.armorClass, character as Image);
        ac.forEach((item) => (item.visible = visible));
        await addItems(ac);
    }
};

export const updateAcVisibility = async (tokens: Array<Item>) => {
    const acChanges = new Map<string, ACItemChanges>();
    for (const token of tokens) {
        const acAttachments = (await getAttachedItems(token.id, ["CURVE"])).filter((a) => attachmentFilter(a, "AC"));
        const data = token.metadata[itemMetadataKey] as GMGMetadata;

        acAttachments.forEach((curve) => {
            const change = acChanges.get(curve.id) ?? {};
            if (curve.visible != (token.visible && !!data.playerMap?.ac)) {
                change.visible = token.visible && !!data.playerMap?.ac;
                acChanges.set(curve.id, change);
            }
        });
    }
    await updateAcChanges(acChanges);
};
