export const highlightDice = (text: string) => {
    const regex = /\d+d\d+/gi;
    const dice = regex.exec(text);
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, index) => {
                let diceField = null;
                if (dice && dice.length >= index) {
                    diceField = <b style={{ textDecoration: "underline" }}>{dice[index]}</b>;
                }
                return (
                    <span key={index}>
                        {part}
                        {diceField}
                    </span>
                );
            })}
        </span>
    );
};
