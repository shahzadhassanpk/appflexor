import iconMap from "./icons";
import List from "./List";

const DropDown = ({
  id = "",
  image = "",
  icon = "",
  label = "",
  items = [],
  handleAction = () => {},
  classes = {
    parent: "",
  },
}) => {
  return (
    <div className={`d-flex position-relative ${classes.parent}`}>
      <div
        className="avatar"
        id={id}
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        {image && (
          <img
            className="image-styling-navbar dropdown-toggle"
            src={`/file/service/dir_user/admin/${image}`}
          />
        )}
        {icon && iconMap[icon]}
        {label && label}
      </div>

      {/* Dropdown Menu */}
      <ul
        id="dropdown-styles"
        className="avatar-dropdown-menu dropdown-menu dropdown-menu-end"
        aria-labelledby={id}
      >
        <List
          items={items}
          renderItem={(item, itemIndex) => (
            <li
              key={item?.id || itemIndex}
              className="dropdown-list-item pointer"
              onClick={() => handleAction(item, itemIndex)}
            >
              <div key={item?.code} className="dropdown-item">
                <div className="d-flex gap-2">
                  {item?.icon} {item?.label}
                </div>
              </div>
            </li>
          )}
        />
      </ul>
    </div>
  );
};

export default DropDown;
