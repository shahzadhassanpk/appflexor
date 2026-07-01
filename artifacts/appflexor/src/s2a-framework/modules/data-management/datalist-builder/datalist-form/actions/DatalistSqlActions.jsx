export default function SqlActions(props) {
    const { selectedItem, handleAction, type } = props;
    return (
        <>
            {selectedItem.layout.actions.map((action, index) => {
                return (
                    <>
                        <div
                            className="row s2a-sql-actions"
                            key={index}>
                            <>
                                {action.type === type && (
                                    <>
                                        <div className="col-sm-1">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                value="action"
                                                onChange={() =>
                                                    handleAction(action)
                                                }
                                                checked={action.selected}
                                            />
                                        </div>
                                        <div className="col-sm-10">
                                            <div className="action-list">
                                                {action.title}
                                            </div>
                                        </div>
                                        <div className="col-sm-1">
                                            {type === "custom" && (
                                                <i className="fa fa-trash"></i>
                                            )}
                                        </div>
                                    </>
                                )}
                            </>
                        </div>
                    </>
                );
            })}
        </>
    );
}
