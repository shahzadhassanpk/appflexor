import React, { useCallback, useState, useEffect } from "react";
import MoveableFormFields from "./MoveableFormFields";
import update from "immutability-helper";
import { ItemTypes } from "../../datalist-designer/itemTypes";
import { useDrop } from "react-dnd";
import Scroll from "../../../../../components/Scroll/Scroll";

export default function FormFields({
    items,
    handleSelectedFields,
    setItems,
    actions,
    fieldType,
    handleSelectedField,
    handleSave,
    selectedFieldItem,
    datalistType,
    selectedItem,
    setSelectedItem,
}) {
    const [cards, setCards] = useState(items);

    useEffect(() => {
        // let orderedItems  = items.sort((a,b) => (b.selected - a.selected) || a.label.localeCompare(b.label));
        // orderedItems  = items.sort((a,b) => a.label.localeCompare(b.label));
        setCards(items);
    }, [items]);

    const findCard = useCallback(
        id => {
            try {
                let card = cards.filter(c => c.id === id);
                card = card[0];
                return {
                    card,
                    index: cards.indexOf(card),
                };
            } catch (error) {
                console.log(error);
            }
        },
        [cards],
    );

    const moveCard = useCallback(
        (id, atIndex) => {
            const { card, index } = findCard(id);
            setCards(
                update(cards, {
                    $splice: [
                        [index, 1],
                        [atIndex, 0, card],
                    ],
                }),
            );
        },
        [findCard, cards, setCards],
    );
    const [, drop] = useDrop(() => ({ accept: ItemTypes.CARD }));

    const moveableFormField = useCallback(
        (
            item,
            index,
            handleSelectedFields,
            moveCard,
            findCard,
            cards,
            actions,
            setItems,
            fieldType,
            handleSelectedField,
            handleSave,
            selectedFieldItem,
            datalistType,
            selectedItem,
            setSelectedItem,
        ) => {
            return (
                <div
                    className="s2a-formfields"
                    key={index}>
                    <MoveableFormFields
                        item={item}
                        index={index}
                        handleSelectedFields={handleSelectedFields}
                        moveCard={moveCard}
                        id={item?.id}
                        findCard={findCard}
                        cards={cards}
                        actions={actions}
                        setItems={setItems}
                        fieldType={fieldType}
                        handleSelectedField={handleSelectedField}
                        handleSave={handleSave}
                        selectedFieldItem={selectedFieldItem}
                        datalistType={datalistType}
                        selectedItem={selectedItem}
                        setSelectedItem={setSelectedItem}
                    />
                </div>
            );
        },
        [],
    );

    return (
        <Scroll height="61.2vh">
            <div ref={drop}>
                {items &&
                    items.map((item, index) =>
                        moveableFormField(
                            item && item,
                            index,
                            handleSelectedFields,
                            moveCard,
                            findCard,
                            cards,
                            actions,
                            setItems,
                            fieldType,
                            handleSelectedField,
                            handleSave,
                            selectedFieldItem,
                            datalistType,
                            selectedItem,
                            setSelectedItem,
                        ),
                    )}
            </div>
        </Scroll>
    );
}
