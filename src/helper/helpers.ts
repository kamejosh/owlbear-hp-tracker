import OBR, { buildText } from "@owlbear-rodeo/sdk";

export const createText = async (text: string, id: string) => {
    const items = await OBR.scene.items.getItems([id]);

    if (items.length > 0) {
        const item = items[0];
        const position = {
            x: item.position.x - 75,
            y: item.position.y + 70,
        };

        return buildText()
            .text({
                type: "PLAIN",
                plainText: text,
                height: 20,
                width: 150,
                style: {
                    fillColor: "#ffffff",
                    fillOpacity: 0.5,
                    strokeColor: "#ffffff",
                    strokeOpacity: 1,
                    strokeWidth: 2,
                    textAlign: "CENTER",
                    textAlignVertical: "TOP",
                    fontFamily: "Roboto, sans-serif",
                    fontSize: 30,
                    fontWeight: 400,
                    lineHeight: 1.2,
                    padding: 5,
                },
                richText: [],
            })
            .position(position)
            .attachedTo(id as string)
            .layer("TEXT")
            .locked(true)
            .visible(true) //TODO: change this to be only visible for selected players
            .build();
    }
};
