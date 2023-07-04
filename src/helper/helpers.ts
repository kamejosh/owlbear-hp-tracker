import OBR, { buildText } from "@owlbear-rodeo/sdk";

export const createText = async (text: string, id: string) => {
    const items = await OBR.scene.items.getItems([id]);

    if (items.length > 0) {
        const item = items[0];
        const position = {
            x: item.position.x - 150,
            y: item.position.y + 70,
        };

        return buildText()
            .text({
                type: "PLAIN",
                plainText: text,
                height: 20,
                width: 300,
                style: {
                    fillColor: "#ffffff",
                    fillOpacity: 1,
                    strokeColor: "#000000",
                    strokeOpacity: 1,
                    strokeWidth: 2,
                    textAlign: "CENTER",
                    textAlignVertical: "TOP",
                    fontFamily: "Roboto, sans-serif",
                    fontSize: 40,
                    fontWeight: 600,
                    lineHeight: 1.2,
                    padding: 10,
                },
                richText: [],
            })
            .position(position)
            .attachedTo(id as string)
            .layer("TEXT")
            .locked(true)
            .visible(true)
            .build();
    }
};
