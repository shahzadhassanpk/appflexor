const moveChecker = (id, setMoveCard) => {
    try {
        let move = true;
        const ariaExpandAttribute = document
            .getElementById(id)
            .getAttribute("aria-expanded");
        console.log(ariaExpandAttribute);
        move = ariaExpandAttribute === "true" ? false : true;

        setMoveCard(move);
    } catch (error) {}
};

export { moveChecker };
